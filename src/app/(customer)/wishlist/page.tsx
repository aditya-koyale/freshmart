import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { listWishlist } from '@/services/wishlistService';

export const metadata: Metadata = { title: 'My Wishlist' };

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?redirect=/wishlist');
  }

  const { products, removedCount } = await listWishlist(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">My Wishlist</h1>

      {removedCount > 0 && (
        <div className="mt-4">
          <Alert variant="warning">
            {removedCount} {removedCount === 1 ? 'item' : 'items'} removed — no longer
            available.
          </Alert>
        </div>
      )}

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later."
            action={<Button href="/products">Browse Products</Button>}
          />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
