import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartLineItemRow } from '@/components/customer/CartLineItemRow';
import { CartSummary } from '@/components/customer/CartSummary';
import { CartNoticeList } from '@/components/customer/CartNoticeList';
import { getCart } from '@/services/cartService';

export const metadata: Metadata = { title: 'My Cart' };

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?redirect=/cart');
  }

  const cart = await getCart(session.user.id);

  if (cart.items.length === 0 && cart.notices.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog and add some fresh fruit to get started."
          action={<Button href="/products">Shop All Products</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">My Cart</h1>

      {cart.notices.length > 0 && (
        <div className="mt-4">
          <CartNoticeList notices={cart.notices} />
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="The items above were removed. Browse the catalog to add something new."
            action={<Button href="/products">Shop All Products</Button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {cart.items.map((item) => (
              <CartLineItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="lg:col-span-1">
            <CartSummary basePricing={cart.pricing} />
          </div>
        </div>
      )}
    </div>
  );
}
