'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

/**
 * NextAuth's useSession(), useCart(), and useWishlist() all need
 * client-side context. Isolated in its own file because these providers
 * must be Client Components, while the root layout stays a Server
 * Component.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
