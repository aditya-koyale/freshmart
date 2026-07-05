import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/api-response';
import { calculatePricing, round2, type PricingBreakdown } from '@/services/pricingService';
import { getAvailableStock } from '@/utils/product';

const CART_ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      deletedAt: true,
      images: { take: 1, orderBy: { displayOrder: 'asc' } },
    },
  },
  weightVariant: {
    include: { inventory: true },
  },
} satisfies Prisma.CartItemInclude;

export type CartNoticeReason = 'OUT_OF_STOCK' | 'PRODUCT_UNAVAILABLE' | 'QUANTITY_REDUCED';

export interface CartNotice {
  productName: string;
  variantLabel: string;
  reason: CartNoticeReason;
  newQuantity?: number;
}

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  weightVariantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
}

export interface CartResult {
  items: CartLine[];
  notices: CartNotice[];
  itemCount: number;
  pricing: PricingBreakdown;
}

/**
 * Fetches the cart and reconciles it against the catalog's current state
 * in the same pass: lines whose product/variant is no longer purchasable
 * are removed, lines whose quantity now exceeds available stock are
 * clamped down — both are reported as `notices` rather than applied
 * silently, so the cart page can tell the customer what changed.
 */
export async function getCart(userId: string): Promise<CartResult> {
  const rawItems = await db.cartItem.findMany({
    where: { userId },
    include: CART_ITEM_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });

  const notices: CartNotice[] = [];
  const validLines: CartLine[] = [];
  const idsToRemove: string[] = [];
  const quantityUpdates: { id: string; quantity: number }[] = [];

  for (const item of rawItems) {
    const isProductUnavailable =
      !item.product || Boolean(item.product.deletedAt) || !item.product.isActive;
    const isVariantUnavailable = !item.weightVariant.isActive;

    if (isProductUnavailable || isVariantUnavailable) {
      idsToRemove.push(item.id);
      notices.push({
        productName: item.product?.name ?? 'A product',
        variantLabel: item.weightVariant.label,
        reason: 'PRODUCT_UNAVAILABLE',
      });
      continue;
    }

    const available = getAvailableStock(item.weightVariant.inventory);

    if (available <= 0) {
      idsToRemove.push(item.id);
      notices.push({
        productName: item.product.name,
        variantLabel: item.weightVariant.label,
        reason: 'OUT_OF_STOCK',
      });
      continue;
    }

    let quantity = item.quantity;
    if (quantity > available) {
      quantity = available;
      quantityUpdates.push({ id: item.id, quantity });
      notices.push({
        productName: item.product.name,
        variantLabel: item.weightVariant.label,
        reason: 'QUANTITY_REDUCED',
        newQuantity: quantity,
      });
    }

    const unitPrice = item.weightVariant.salePrice
      ? item.weightVariant.salePrice.toNumber()
      : item.weightVariant.price.toNumber();

    validLines.push({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.images[0]?.url ?? null,
      weightVariantId: item.weightVariant.id,
      variantLabel: item.weightVariant.label,
      unitPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
      availableStock: available,
    });
  }

  if (idsToRemove.length > 0) {
    await db.cartItem.deleteMany({ where: { id: { in: idsToRemove } } });
  }
  for (const update of quantityUpdates) {
    await db.cartItem.update({ where: { id: update.id }, data: { quantity: update.quantity } });
  }

  const pricing = calculatePricing({
    items: validLines.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
  });

  const itemCount = validLines.reduce((sum, line) => sum + line.quantity, 0);

  return { items: validLines, notices, itemCount, pricing };
}

/**
 * Lightweight count for the header badge — intentionally skips the full
 * reconciliation pass above (that runs on the actual cart page) so
 * showing the badge doesn't trigger a write on every page load. Worst
 * case it's briefly stale until the cart page is opened, never wrong in
 * a way that loses data.
 */
export async function getCartItemCount(userId: string): Promise<number> {
  const result = await db.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export interface AddToCartInput {
  weightVariantId: string;
  quantity: number;
}

/**
 * Adding a variant already in the cart increases its quantity (merge)
 * rather than erroring or creating a duplicate row — standard cart UX.
 * Stock is validated against the combined quantity, not just the new
 * addition.
 */
export async function addToCart(userId: string, input: AddToCartInput) {
  const variant = await db.weightVariant.findUnique({
    where: { id: input.weightVariantId },
    include: { inventory: true, product: true },
  });

  if (
    !variant ||
    !variant.isActive ||
    !variant.product.isActive ||
    variant.product.deletedAt
  ) {
    throw new NotFoundError('This product is no longer available');
  }

  const available = getAvailableStock(variant.inventory);
  if (available <= 0) {
    throw new AppError('This item is currently out of stock', 409, 'OUT_OF_STOCK');
  }

  const existing = await db.cartItem.findUnique({
    where: { userId_weightVariantId: { userId, weightVariantId: input.weightVariantId } },
  });

  const requestedTotal = (existing?.quantity ?? 0) + input.quantity;

  if (requestedTotal > available) {
    const alreadyInCartNote = existing
      ? ` (you already have ${existing.quantity} in your cart)`
      : '';
    throw new AppError(
      `Only ${available} left in stock${alreadyInCartNote}.`,
      409,
      'INSUFFICIENT_STOCK',
    );
  }

  if (existing) {
    return db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: requestedTotal },
    });
  }

  return db.cartItem.create({
    data: {
      userId,
      productId: variant.productId,
      weightVariantId: input.weightVariantId,
      quantity: input.quantity,
    },
  });
}

/**
 * Unlike getCart's automatic clamping, an explicit quantity change from
 * the cart page is rejected outright if it exceeds stock — the customer
 * just typed/clicked that number, so silently overriding it would be
 * more confusing than telling them why it can't be applied.
 */
export async function updateCartItemQuantity(
  userId: string,
  cartItemId: string,
  quantity: number,
) {
  const item = await db.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { weightVariant: { include: { inventory: true } } },
  });

  if (!item) {
    throw new NotFoundError('Cart item not found');
  }

  const available = getAvailableStock(item.weightVariant.inventory);
  if (quantity > available) {
    throw new AppError(`Only ${available} left in stock.`, 409, 'INSUFFICIENT_STOCK');
  }

  return db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const item = await db.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!item) {
    throw new NotFoundError('Cart item not found');
  }
  await db.cartItem.delete({ where: { id: cartItemId } });
}

export async function clearCart(userId: string) {
  await db.cartItem.deleteMany({ where: { userId } });
}
