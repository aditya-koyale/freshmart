'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import { useCart } from '@/context/CartContext';

export interface AddToCartButtonProps {
  weightVariantId: string;
  quantity?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Called after a successful add — e.g. to reset a quantity stepper. */
  onAdded?: () => void;
}

/**
 * Shared by ProductCard (quick-add, quantity always 1) and
 * ProductVariantPanel (quantity from the stepper) — one place that
 * knows how to call the cart API, handle stock/auth errors, and update
 * the header badge.
 */
export function AddToCartButton({
  weightVariantId,
  quantity = 1,
  disabled = false,
  size = 'sm',
  onAdded,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshCount } = useCart();

  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus('loading');
    setErrorMessage(null);

    try {
      await apiRequest('/api/cart', { body: { weightVariantId, quantity } });
      await refreshCount();
      setStatus('added');
      onAdded?.();
      setTimeout(() => setStatus('idle'), 1500);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setStatus('error');
      setErrorMessage(
        error instanceof ApiRequestError ? error.message : 'Could not add to cart.',
      );
      setTimeout(() => setStatus('idle'), 2500);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size={size}
        variant={status === 'added' ? 'secondary' : 'primary'}
        isLoading={status === 'loading'}
        disabled={disabled || status === 'loading'}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleClick();
        }}
      >
        {status === 'added' ? 'Added ✓' : 'Add to Cart'}
      </Button>
      {status === 'error' && errorMessage && (
        <p role="alert" className="text-xs text-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
