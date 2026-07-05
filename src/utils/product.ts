/**
 * Shared logic for deriving display price and stock status from a weight
 * variant + its inventory row. Centralized here so ProductCard, the
 * product detail page, and (later) the cart all agree on what "in stock"
 * and "the price" mean — duplicating this per-component is how those
 * subtly drift apart.
 */

export interface InventoryLike {
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
}

export interface VariantLike {
  id: string;
  label: string;
  price: number | string;
  salePrice?: number | string | null;
  isActive: boolean;
  inventory?: InventoryLike | null;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

/** The price a customer actually pays: sale price if set, else list price. */
export function getEffectivePrice(variant: VariantLike): number {
  const salePrice = variant.salePrice != null ? toNumber(variant.salePrice) : null;
  return salePrice ?? toNumber(variant.price);
}

export function getDiscountPercent(variant: VariantLike): number | null {
  if (variant.salePrice == null) return null;
  const price = toNumber(variant.price);
  const sale = toNumber(variant.salePrice);
  if (sale >= price || price === 0) return null;
  return Math.round(((price - sale) / price) * 100);
}

export function getAvailableStock(inventory: InventoryLike | null | undefined): number {
  if (!inventory) return 0;
  return Math.max(inventory.stock - inventory.reservedStock, 0);
}

export function getStockStatus(variant: VariantLike): StockStatus {
  if (!variant.isActive) return 'OUT_OF_STOCK';
  const available = getAvailableStock(variant.inventory);
  if (available <= 0) return 'OUT_OF_STOCK';
  if (available <= (variant.inventory?.lowStockThreshold ?? 10)) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/**
 * The variant shown by default on a product card / detail page: the
 * cheapest active variant that still has stock, falling back to the
 * cheapest active variant if everything is out of stock (so the card can
 * still show a price and an "Out of stock" badge rather than nothing).
 */
export function getDefaultVariant(variants: VariantLike[]): VariantLike | null {
  const active = variants.filter((v) => v.isActive);
  if (active.length === 0) return null;

  const inStock = active.filter((v) => getStockStatus(v) !== 'OUT_OF_STOCK');
  const pool = inStock.length > 0 ? inStock : active;

  return pool.reduce((cheapest, current) =>
    getEffectivePrice(current) < getEffectivePrice(cheapest) ? current : cheapest,
  );
}
