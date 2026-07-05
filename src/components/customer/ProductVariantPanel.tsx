'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { AddToCartButton } from '@/components/customer/AddToCartButton';
import { formatPrice } from '@/utils/format';
import {
  getDefaultVariant,
  getEffectivePrice,
  getDiscountPercent,
  getStockStatus,
  getAvailableStock,
  toNumber,
  type VariantLike,
} from '@/utils/product';

/**
 * Lets the customer pick a weight variant, choose a quantity, and add it
 * to the cart — the Add to Cart control flagged as pending in Phase 1.
 */
export function ProductVariantPanel({ variants }: { variants: VariantLike[] }) {
  const defaultVariant = getDefaultVariant(variants);
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const activeVariants = variants.filter((v) => v.isActive);
  const selected = activeVariants.find((v) => v.id === selectedId) ?? defaultVariant;

  // Reset quantity when the customer switches variants — the previous
  // quantity may exceed the new variant's stock.
  useEffect(() => {
    setQuantity(1);
  }, [selected?.id]);

  if (!selected) {
    return (
      <Badge variant="error">This product is currently unavailable</Badge>
    );
  }

  const stockStatus = getStockStatus(selected);
  const discount = getDiscountPercent(selected);
  const availableStock = getAvailableStock(selected.inventory);
  const isOutOfStock = stockStatus === 'OUT_OF_STOCK';

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-ink">
            {formatPrice(getEffectivePrice(selected))}
          </span>
          {discount && (
            <>
              <span className="text-sm text-ink-faint line-through">
                {formatPrice(toNumber(selected.price))}
              </span>
              <Badge variant="success">{discount}% off</Badge>
            </>
          )}
        </div>
        <p className="mt-1 text-sm">
          {stockStatus === 'OUT_OF_STOCK' && <span className="text-error">Out of stock</span>}
          {stockStatus === 'LOW_STOCK' && (
            <span className="text-warning">Only a few left in stock</span>
          )}
          {stockStatus === 'IN_STOCK' && <span className="text-success">In stock</span>}
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Select weight</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {activeVariants.map((variant) => {
            const variantStock = getStockStatus(variant);
            const isSelected = variant.id === selected.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                disabled={variantStock === 'OUT_OF_STOCK'}
                aria-pressed={isSelected}
                className={clsx(
                  'rounded-control border px-4 py-2 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-ink hover:bg-surface-subtle',
                  variantStock === 'OUT_OF_STOCK' && 'cursor-not-allowed opacity-50',
                )}
              >
                {variant.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <QuantityStepper
            quantity={quantity}
            max={availableStock}
            onChange={setQuantity}
          />
          <div className="flex-1">
            <AddToCartButton
              weightVariantId={selected.id}
              quantity={quantity}
              size="lg"
              onAdded={() => setQuantity(1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
