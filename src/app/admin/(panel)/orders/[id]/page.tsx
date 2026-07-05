import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/admin/PageHeader';
import { OrderStatusTimeline } from '@/components/admin/OrderStatusTimeline';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { OrderInternalNote } from '@/components/admin/OrderInternalNote';
import { getAdminOrderById } from '@/services/adminOrderService';
import { NotFoundError } from '@/lib/api-response';
import { formatPrice } from '@/utils/format';

const STATUS_BADGES: Record<string, { label: string; variant: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  PENDING:          { label: 'Pending', variant: 'warning' },
  CONFIRMED:        { label: 'Confirmed', variant: 'primary' },
  PREPARING:        { label: 'Preparing', variant: 'primary' },
  PACKED:           { label: 'Packed', variant: 'neutral' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'accent' },
  DELIVERED:        { label: 'Delivered', variant: 'success' },
  CANCELLED:        { label: 'Cancelled', variant: 'error' },
  REFUNDED:         { label: 'Refunded', variant: 'error' },
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const order = await getAdminOrderById(params.id);
    return { title: `Order ${order.orderNumber} — FreshMart Admin` };
  } catch {
    return { title: 'Order — FreshMart Admin' };
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let order;
  try {
    order = await getAdminOrderById(params.id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const statusInfo = STATUS_BADGES[order.status] ?? { label: order.status, variant: 'neutral' as const };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/admin/orders" className="hover:text-primary">
              Orders
            </Link>
            <span>/</span>
            <span>{order.orderNumber}</span>
          </span>
        }
        action={<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: items + pricing */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order Items */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Items ({order.items.length})
            </h2>
            <ul className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-control bg-surface-subtle">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/products/${item.productSlug}`}
                      className="block truncate text-sm font-medium text-ink hover:text-primary"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {item.weightLabel} &times; {item.quantity} ·{' '}
                      {formatPrice(item.priceAtPurchase)} each
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-ink">
                    {formatPrice(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pricing */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Payment Summary
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd>{formatPrice(order.pricing.subtotal)}</dd>
              </div>
              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-success">
                    Coupon{order.couponCode ? ` (${order.couponCode})` : ''}
                  </dt>
                  <dd className="text-success">
                    −{formatPrice(order.pricing.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd>
                  {order.pricing.deliveryCharge === 0
                    ? 'Free'
                    : formatPrice(order.pricing.deliveryCharge)}
                </dd>
              </div>
              {order.pricing.taxAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Tax</dt>
                  <dd>{formatPrice(order.pricing.taxAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(order.pricing.grandTotal)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-ink-faint">
              Payment: {order.paymentMethod} ·{' '}
              <span
                className={
                  order.paymentStatus === 'PAID' ? 'text-success' : 'text-warning'
                }
              >
                {order.paymentStatus}
              </span>
            </p>
          </Card>

          {/* Internal Note */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Internal Note
            </h2>
            <OrderInternalNote orderId={order.id} initialNote={order.internalNote} />
          </Card>
        </div>

        {/* Right column: status + customer + address */}
        <div className="flex flex-col gap-6">
          {/* Status management */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Update Status
            </h2>
            <OrderStatusUpdater
              orderId={order.id}
              currentStatus={order.status}
              validNextStatuses={order.validNextStatuses}
            />
          </Card>

          {/* Order timeline */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Status Timeline
            </h2>
            <OrderStatusTimeline history={order.statusHistory} />
          </Card>

          {/* Customer */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Customer
            </h2>
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium text-ink">{order.customer.fullName}</p>
              <p className="text-ink-muted">{order.customer.email}</p>
              <p className="text-ink-muted">{order.customer.mobileNumber}</p>
              <Link
                href={`/admin/customers/${order.customer.id}`}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                View customer →
              </Link>
            </div>
          </Card>

          {/* Delivery address */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Delivery Address
            </h2>
            <div className="text-sm text-ink-muted">
              <p className="font-medium text-ink">{order.address.fullName}</p>
              <p>{order.address.mobileNumber}</p>
              <p>
                {order.address.houseNumber}
                {order.address.buildingName ? `, ${order.address.buildingName}` : ''},
                {' '}{order.address.street}
              </p>
              {order.address.landmark && <p>Near {order.address.landmark}</p>}
              <p>
                {order.address.area}, {order.address.city}, {order.address.state}{' '}
                — {order.address.pinCode}
              </p>
            </div>

            {order.deliverySlot && (
              <div className="mt-3 border-t border-border pt-3 text-sm">
                <p className="text-xs font-medium text-ink-muted">Delivery slot</p>
                <p className="text-ink">
                  {new Date(order.deliverySlot.date).toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}{' '}
                  · {order.deliverySlot.startTime} – {order.deliverySlot.endTime}
                </p>
              </div>
            )}
          </Card>

          {/* Customer note */}
          {order.customerNote && (
            <Card padding="md">
              <h2 className="mb-2 font-display text-sm font-semibold text-ink">
                Customer Note
              </h2>
              <p className="text-sm italic text-ink-muted">
                &ldquo;{order.customerNote}&rdquo;
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
