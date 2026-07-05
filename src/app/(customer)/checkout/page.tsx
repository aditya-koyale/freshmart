import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckoutClient } from '@/components/customer/CheckoutClient';
import { listAddresses } from '@/services/addressService';
import { getCart } from '@/services/cartService';
import { getCheckoutQuote, type CheckoutQuote } from '@/services/checkoutService';
import { listUpcomingDeliverySlots } from '@/services/deliverySlotService';
import { AppError } from '@/lib/api-response';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?redirect=/checkout');
  }

  const cart = await getCart(session.user.id);
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Add some products before checking out."
          action={<Button href="/products">Shop All Products</Button>}
        />
      </div>
    );
  }

  const addresses = await listAddresses(session.user.id);
  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Add a delivery address"
          description="You'll need at least one saved address before you can check out."
          action={<Button href="/addresses/new">Add Address</Button>}
        />
      </div>
    );
  }

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

  let initialQuote: CheckoutQuote | null = null;
  let initialError: string | null = null;
  try {
    initialQuote = await getCheckoutQuote(session.user.id, { addressId: defaultAddress.id });
  } catch (error) {
    initialError =
      error instanceof AppError ? error.message : 'Could not load checkout details.';
  }

  const slots = await listUpcomingDeliverySlots();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Checkout</h1>
      <CheckoutClient
        addresses={addresses}
        initialAddressId={defaultAddress.id}
        initialQuote={initialQuote}
        initialError={initialError}
        slots={slots}
      />
    </div>
  );
}
