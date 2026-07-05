'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { apiRequest } from '@/lib/api-client';

interface CartContextValue {
  count: number;
  refreshCount: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Holds only the cart item count (for the header badge) — the actual
 * cart contents are always fetched fresh by the cart page itself via
 * cartService.getCart(), which also does stock reconciliation. Keeping
 * that logic server-side and out of this client context avoids two
 * sources of truth for "what's in the cart."
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const result = await apiRequest<{ count: number }>('/api/cart/count', { method: 'GET' });
      setCount(result.count);
    } catch {
      // Badge count is non-critical — fail silently rather than surface
      // an error for what the user didn't even ask for.
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      refreshCount();
    } else {
      setCount(0);
    }
  }, [status, refreshCount]);

  return (
    <CartContext.Provider value={{ count, refreshCount }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
