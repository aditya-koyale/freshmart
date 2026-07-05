import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/api-response';
import { PUBLIC_PRODUCT_INCLUDE, serializeProductForClient } from '@/services/productService';

/**
 * Returns wishlisted products already shaped exactly like
 * listPublicProducts' output (same include, same Decimal-to-number
 * serialization) — so the wishlist page can render them through the
 * existing ProductGrid/ProductCard components with zero new markup.
 *
 * Products that were soft-deleted or deactivated after being wishlisted
 * are dropped from the result and their WishlistItem row is cleaned up,
 * mirroring the cart's self-reconciling read.
 */
export async function listWishlist(userId: string) {
  const rawItems = await db.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: PUBLIC_PRODUCT_INCLUDE } },
    orderBy: { createdAt: 'desc' },
  });

  const idsToRemove: string[] = [];
  const products = [];

  for (const item of rawItems) {
    const product = item.product;
    const isUnavailable = !product || Boolean(product.deletedAt) || !product.isActive;

    if (isUnavailable) {
      idsToRemove.push(item.id);
      continue;
    }

    products.push(serializeProductForClient(product));
  }

  if (idsToRemove.length > 0) {
    await db.wishlistItem.deleteMany({ where: { id: { in: idsToRemove } } });
  }

  return { products, removedCount: idsToRemove.length };
}

/**
 * Just the IDs — what WishlistContext fetches once per session to drive
 * every heart icon on the site without a per-card network request.
 */
export async function getWishlistedProductIds(userId: string): Promise<string[]> {
  const items = await db.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((item) => item.productId);
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.deletedAt || !product.isActive) {
    throw new NotFoundError('Product not found');
  }

  await db.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

/**
 * Idempotent — removing something not on the wishlist is not an error,
 * since the toggle button on the client can't always be certain of the
 * exact current state (e.g. after a stale optimistic update).
 */
export async function removeFromWishlist(userId: string, productId: string) {
  await db.wishlistItem.deleteMany({ where: { userId, productId } });
}
