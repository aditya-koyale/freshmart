'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useWishlist } from '@/context/WishlistContext';
import { ApiRequestError } from '@/lib/api-client';

export interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Self-contained heart toggle — reads and writes through WishlistContext,
 * so it works identically wherever it's dropped (ProductCard grid tiles,
 * the product detail page) with no props beyond the product's own ID.
 */
export function WishlistButton({ productId, size = 'md', className }: WishlistButtonProps) {
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  const active = isWishlisted(productId);
  const dimension = size === 'sm' ? 32 : 40;

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (isPending) return;
    setIsPending(true);

    try {
      await toggle(productId);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      style={{ width: dimension, height: dimension }}
      className={clsx(
        'flex items-center justify-center rounded-full bg-surface/90 shadow-soft backdrop-blur transition-colors hover:bg-surface disabled:cursor-wait',
        className,
      )}
    >
      <svg
        width={size === 'sm' ? 16 : 18}
        height={size === 'sm' ? 16 : 18}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        className={active ? 'text-error' : 'text-ink-muted'}
        aria-hidden="true"
      >
        <path
          d="M12 20s-7-4.4-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 11c-2.5 4.6-9.5 9-9.5 9z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
