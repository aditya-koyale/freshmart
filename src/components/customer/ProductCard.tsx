import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { AddToCartButton } from '@/components/customer/AddToCartButton';
import { WishlistButton } from '@/components/customer/WishlistButton';
import {
  getDefaultVariant,
  getEffectivePrice,
  getDiscountPercent,
  getStockStatus,
  toNumber,
  type VariantLike,
} from '@/utils/product';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  isBestSeller: boolean;
  isSeasonal: boolean;
  isNewArrival: boolean;
  images: { url: string }[];
  weightVariants: VariantLike[];
}

/**
 * The single card used for every product grid in the app (home, category,
 * listing, search). Links to the product detail page, with a quick-add
 * button for the default variant and a wishlist heart toggle — full
 * variant selection still requires visiting the detail page.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const variant = getDefaultVariant(product.weightVariants);
  const stockStatus = variant ? getStockStatus(variant) : 'OUT_OF_STOCK';
  const discount = variant ? getDiscountPercent(variant) : null;
  const coverImage = product.images[0]?.url;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card padding="none" interactive className="overflow-hidden">
        <div className="relative aspect-square w-full bg-surface-subtle">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-ink-faint"
              aria-hidden="true"
            >
              <FruitPlaceholderIcon />
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isBestSeller && <Badge variant="accent">Best Seller</Badge>}
            {product.isSeasonal && <Badge variant="primary">Seasonal</Badge>}
            {product.isNewArrival && <Badge variant="neutral">New</Badge>}
          </div>

          <div className="absolute right-2 top-2">
            <WishlistButton productId={product.id} size="sm" />
          </div>

          {stockStatus === 'OUT_OF_STOCK' && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3.5">
          <h3 className="line-clamp-1 font-display text-sm font-semibold text-ink">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="line-clamp-1 text-xs text-ink-muted">
              {product.shortDescription}
            </p>
          )}

          {variant ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {formatPrice(getEffectivePrice(variant))}
              </span>
              {discount && (
                <>
                  <span className="text-xs text-ink-faint line-through">
                    {formatPrice(toNumber(variant.price))}
                  </span>
                  <Badge variant="success">{discount}% off</Badge>
                </>
              )}
              <span className="text-xs text-ink-faint">/ {variant.label}</span>
            </div>
          ) : (
            <span className="mt-1 text-xs text-ink-faint">Currently unavailable</span>
          )}

          {stockStatus === 'LOW_STOCK' && (
            <span className="text-xs font-medium text-warning">Only a few left</span>
          )}

          {variant && (
            <div className="mt-2">
              <AddToCartButton
                weightVariantId={variant.id}
                disabled={stockStatus === 'OUT_OF_STOCK'}
              />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function FruitPlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21c4.5 0 7-3.5 7-8 0-3-1.5-5-3-6 .3-1 0-2.5-1-3.5-1 1-1.5 2.2-1.5 3.2C12.8 6.2 12 6 12 6s-.8.2-1.5.7C10.5 5.7 10 4.5 9 3.5c-1 1-1.3 2.5-1 3.5-1.5 1-3 3-3 6 0 4.5 2.5 8 7 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
