import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductInfoForm } from '@/components/admin/ProductInfoForm';
import { WeightVariantManagerEdit } from '@/components/admin/WeightVariantManager';
import { ImageUploadManager } from '@/components/admin/ImageUploadManager';
import { getAdminProductById } from '@/services/productService';
import { listAdminCategories } from '@/services/categoryService';
import { NotFoundError } from '@/lib/api-response';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const product = await getAdminProductById(params.id);
    return { title: `Edit ${product.name} — FreshMart Admin` };
  } catch {
    return { title: 'Edit Product — FreshMart Admin' };
  }
}

export default async function ProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  let product;
  try {
    product = await getAdminProductById(params.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const categories = await listAdminCategories();

  // Serialize Prisma Decimal fields before crossing the server→client boundary
  const variantsForClient = product.weightVariants.map((v) => ({
    id: v.id,
    label: v.label,
    price: v.price.toNumber(),
    salePrice: v.salePrice?.toNumber() ?? null,
    isActive: v.isActive,
    inventory: v.inventory
      ? {
          id: v.inventory.id,
          stock: v.inventory.stock,
          reservedStock: v.inventory.reservedStock,
          lowStockThreshold: v.inventory.lowStockThreshold,
        }
      : null,
  }));

  const imagesForClient = product.images.map((img) => ({
    id: img.id,
    url: img.url,
    displayOrder: img.displayOrder,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={product.name}
        description={
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/admin/products" className="hover:text-primary">
              Products
            </Link>
            <span>/</span>
            <span>{product.name}</span>
          </span>
        }
      />

      {/* Basic Info */}
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">
          Basic Information
        </h2>
        <ProductInfoForm
          productId={product.id}
          initial={{
            categoryId: product.categoryId,
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            sku: product.sku,
            origin: product.origin,
            freshnessInfo: product.freshnessInfo,
            storageInfo: product.storageInfo,
            isFeatured: product.isFeatured,
            isBestSeller: product.isBestSeller,
            isSeasonal: product.isSeasonal,
            isNewArrival: product.isNewArrival,
            isActive: product.isActive,
          }}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>

      {/* Images */}
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">
          Product Images
        </h2>
        <ImageUploadManager
          productId={product.id}
          images={imagesForClient}
        />
      </section>

      {/* Weight Variants */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4">
          <h2 className="font-display text-sm font-semibold text-ink">
            Weight Variants
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Each variant is the purchasable unit. Changes save immediately.
          </p>
        </div>
        <WeightVariantManagerEdit
          variants={variantsForClient}
          productId={product.id}
        />
      </section>
    </div>
  );
}
