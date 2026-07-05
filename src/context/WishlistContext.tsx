'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

interface WishlistContextValue {
  isWishlisted: (productId: string) => boolean;
  /** Returns the new state (true = now wishlisted) so callers can react, or null on failure. */
  toggle: (productId: string) => Promise<boolean | null>;
  isReady: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Loads the full set of wishlisted product IDs once per session and
 * keeps it in memory — every heart icon on every page reads from this
 * instead of making its own request. Mirrors CartContext's approach for
 * the same reason: one source of truth, no prop drilling through every
 * listing page.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await apiRequest<{ productIds: string[] }>('/api/wishlist/ids', {
        method: 'GET',
      });
      setIds(new Set(result.productIds));
    } catch {
      // Non-critical — the wishlist will just appear empty until the
      // next successful refresh rather than surfacing an error.
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      refresh();
    } else if (status === 'unauthenticated') {
      setIds(new Set());
      setIsReady(true);
    }
  }, [status, refresh]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string): Promise<boolean | null> => {
      const currentlyWishlisted = ids.has(productId);

      // Optimistic update for snappy heart-icon feedback.
      setIds((prev) => {
        const next = new Set(prev);
        if (currentlyWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (currentlyWishlisted) {
          await apiRequest(`/api/wishlist/${productId}`, { method: 'DELETE' });
        } else {
          await apiRequest('/api/wishlist', { body: { productId } });
        }
        return !currentlyWishlisted;
      } catch (error) {
        // Roll back the optimistic update on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (currentlyWishlisted) next.add(productId);
          else next.delete(productId);
          return next;
        });

        if (error instanceof ApiRequestError && error.status === 401) {
          throw error; // Let the caller (WishlistButton) handle the redirect.
        }
        return null;
      }
    },
    [ids],
  );

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggle, isReady }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
