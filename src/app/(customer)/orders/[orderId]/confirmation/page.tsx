import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { OrderReceipt } from '@/components/customer/OrderReceipt';
import { getOrderById } from '@/services/orderService';
import { NotFoundError } from '@/lib/api-response';

export const metadata: Metadata = { title: 'Order Confirmed' };

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?redirect=/orders/${params.orderId}/confirmation`);
  }

  let order;
  try {
    order = await getOrderById(session.user.id, params.orderId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Order Confirmed!</h1>
        <p className="mt-1 text-ink-muted">
          Thanks for your order — we&apos;ll start getting it ready right away.
        </p>
      </div>

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>

      <div className="mt-6 flex justify-center">
        <Button href="/products">Continue Shopping</Button>
      </div>
    </div>
  );
}
