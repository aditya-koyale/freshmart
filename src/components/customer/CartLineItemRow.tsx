'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/utils/format';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import { useCart } from '@/context/CartContext';
import type { CartLine } from '@/services/cartService';

export function CartLineItemRow({ item }: { item: CartLine }) {
  const router = useRouter();
  const { refreshCount } = useCart();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuantityChange(quantity: number) {
    setError(null);
    setIsWorking(true);
    try {
      await apiRequest(`/api/cart/${item.id}`, { method: 'PATCH', body: { quantity } });
      await refreshCount();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not update quantity.');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setIsWorking(true);
    try {
      await apiRequest(`/api/cart/${item.id}`, { method: 'DELETE' });
      await refreshCount();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not remove item.');
      setIsWorking(false);
    }
  }

  return (
    <Card padding="md">
      <div className="flex gap-4">
        <Link
          href={`/products/${item.productSlug}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-control bg-surface-subtle"
        >
          {item.imageUrl && (
            <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
          )}
        </Link>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <Link
              href={`/products/${item.productSlug}`}
              className="font-display text-sm font-semibold text-ink hover:text-primary"
            >
              {item.productName}
            </Link>
            <p className="text-xs text-ink-muted">
              {item.variantLabel} &middot; {formatPrice(item.unitPrice)} each
            </p>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="mt-2 flex items-center justify-between">
            <QuantityStepper
              quantity={item.quantity}
              max={item.availableStock}
              onChange={handleQuantityChange}
              disabled={isWorking}
            />
            <span className="font-display text-sm font-semibold text-ink">
              {formatPrice(item.lineTotal)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isWorking}
        className="mt-3 text-xs font-medium text-ink-muted hover:text-error disabled:opacity-50"
      >
        Remove
      </button>
    </Card>
  );
}
