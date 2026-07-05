import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, NotFoundError, AppError } from '@/lib/api-response';
import type {
  ProductInput,
  ProductUpdateInput,
  ProductListQuery,
  WeightVariantInput,
} from '@/lib/validation/product';

export const PUBLIC_PRODUCT_INCLUDE = {
  images: { orderBy: { displayOrder: 'asc' as const } },
  weightVariants: {
    where: { isActive: true },
    include: { inventory: true },
  },
  category: true,
} satisfies Prisma.ProductInclude;

/**
 * Prisma's `Decimal` type for price/salePrice doesn't structurally match
 * the `number | string` types the UI layer (utils/product.ts) expects.
 * Going through an API route masks this, since NextResponse.json()
 * stringifies Decimal automatically — but server components that call
 * this service directly do not. Serializing here keeps Prisma-specific
 * types from leaking into the presentation layer at all.
 */
export function serializeProductForClient<
  T extends { weightVariants: Array<{ price: Prisma.Decimal; salePrice: Prisma.Decimal | null }> },
>(product: T) {
  return {
    ...product,
    weightVariants: product.weightVariants.map((variant) => ({
      ...variant,
      price: variant.price.toNumber(),
      salePrice: variant.salePrice?.toNumber() ?? null,
    })),
  };
}

/**
 * Customer-facing product listing: active products only, with optional
 * category/search/flag filters and pagination (SRS Part 2 §3–§9).
 */
export async function listPublicProducts(query: ProductListQuery) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (query.categorySlug) {
    where.category = { slug: query.categorySlug };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { shortDescription: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.featured) where.isFeatured = true;
  if (query.bestSeller) where.isBestSeller = true;
  if (query.seasonal) where.isSeasonal = true;
  if (query.newArrival) where.isNewArrival = true;

  const [rawItems, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PUBLIC_PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);

  const items = rawItems.map(serializeProductForClient);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await db.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      ...PUBLIC_PRODUCT_INCLUDE,
      reviews: {
        where: { isApproved: true, isHidden: false },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return serializeProductForClient(product);
}

export async function listAdminProducts(query: ProductListQuery) {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (query.categorySlug) {
    where.category = { slug: query.categorySlug };
  }
  if (query.search) {
    where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
  }

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: true,
        weightVariants: { include: { inventory: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError('A product with this slug already exists');
  }
}

/**
 * Creates a product together with its weight variants and their initial
 * inventory rows in a single transaction, so a product is never left in a
 * state where it exists but has no purchasable unit (decision: "Order
 * Quantity" §2 — every product must have at least one weight variant).
 */
export async function createProduct(input: ProductInput) {
  await assertSlugAvailable(input.slug);

  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new NotFoundError('Selected category does not exist');
  }

  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        origin: input.origin,
        freshnessInfo: input.freshnessInfo,
        storageInfo: input.storageInfo,
        isFeatured: input.isFeatured,
        isBestSeller: input.isBestSeller,
        isSeasonal: input.isSeasonal,
        isNewArrival: input.isNewArrival,
        isActive: input.isActive,
        sku: input.sku,
      },
    });

    for (const variant of input.weightVariants) {
      await tx.weightVariant.create({
        data: {
          productId: product.id,
          label: variant.label,
          price: variant.price,
          salePrice: variant.salePrice,
          isActive: variant.isActive,
          inventory: {
            create: {
              stock: variant.initialStock,
              lowStockThreshold: variant.lowStockThreshold,
            },
          },
        },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { weightVariants: { include: { inventory: true } }, category: true },
    });
  });
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new NotFoundError('Product not found');
  }

  if (input.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  return db.product.update({ where: { id }, data: input });
}

/**
 * Soft delete only (SRS Part 10 §1) — historical orders must keep their
 * product reference intact even after a product is removed from sale.
 */
export async function deleteProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new NotFoundError('Product not found');
  }

  return db.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

// ───────────────────────── Weight Variants ─────────────────────────
// The administrator can create, edit, or remove weight variants for any
// product at any time (decision: "Order Quantity" §2).

export async function addWeightVariant(productId: string, input: WeightVariantInput) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.deletedAt) {
    throw new NotFoundError('Product not found');
  }

  return db.weightVariant.create({
    data: {
      productId,
      label: input.label,
      price: input.price,
      salePrice: input.salePrice,
      isActive: input.isActive,
      inventory: {
        create: {
          stock: input.initialStock,
          lowStockThreshold: input.lowStockThreshold,
        },
      },
    },
    include: { inventory: true },
  });
}

export async function updateWeightVariant(
  variantId: string,
  input: Partial<Pick<WeightVariantInput, 'label' | 'price' | 'salePrice' | 'isActive'>>,
) {
  const variant = await db.weightVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    throw new NotFoundError('Weight variant not found');
  }

  return db.weightVariant.update({ where: { id: variantId }, data: input });
}

/**
 * Removing a variant is blocked if it has order history — deactivating
 * instead preserves past orders' integrity. This mirrors the
 * price-snapshot rule in OrderItem (SRS Part 5 §10).
 */
export async function removeWeightVariant(variantId: string) {
  const variant = await db.weightVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    throw new NotFoundError('Weight variant not found');
  }

  const orderItemCount = await db.orderItem.count({ where: { weightVariantId: variantId } });

  if (orderItemCount > 0) {
    return db.weightVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  }

  await db.inventory.deleteMany({ where: { weightVariantId: variantId } });
  return db.weightVariant.delete({ where: { id: variantId } });
}

export async function getAdminProductById(id: string) {
  const product = await db.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      weightVariants: { include: { inventory: true }, orderBy: { createdAt: 'asc' } },
      category: true,
    },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
}

