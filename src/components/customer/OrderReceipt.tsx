import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import type { OrderDetail } from '@/services/orderService';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

/**
 * Read-only order display — items, address, delivery slot, and pricing
 * breakdown. Built for the confirmation page now, but deliberately not
 * coupled to it: a future order detail/history page (out of this
 * module's scope) can reuse this exact component unchanged.
 */
export function OrderReceipt({ order }: { order: OrderDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-ink-muted">Order Number</p>
            <p className="font-display text-lg font-bold text-ink">{order.orderNumber}</p>
          </div>
          <Badge variant="primary">{STATUS_LABELS[order.status] ?? order.status}</Badge>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Placed on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-sm font-semibold text-ink">Items</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-control bg-surface-subtle">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-ink-muted">
                  {item.weightLabel} &times; {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-ink">{formatPrice(item.total)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-sm font-semibold text-ink">Delivery Details</h2>
        <div className="mt-3 text-sm text-ink-muted">
          <p className="font-medium text-ink">
            {order.address.fullName} &middot; {order.address.mobileNumber}
          </p>
          <p>
            {order.address.houseNumber}
            {order.address.buildingName ? `, ${order.address.buildingName}` : ''},{' '}
            {order.address.street}
          </p>
          {order.address.landmark && <p>Near {order.address.landmark}</p>}
          <p>
            {order.address.area}, {order.address.city}, {order.address.state} —{' '}
            {order.address.pinCode}
          </p>
        </div>
        {order.deliverySlot && (
          <p className="mt-3 text-sm text-ink-muted">
            Delivery slot:{' '}
            <span className="font-medium text-ink">
              {new Date(order.deliverySlot.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              , {order.deliverySlot.startTime} – {order.deliverySlot.endTime}
            </span>
          </p>
        )}
        <p className="mt-3 text-sm text-ink-muted">
          Payment method: <span className="font-medium text-ink">Cash on Delivery</span>
        </p>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-sm font-semibold text-ink">Payment Summary</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="text-ink">{formatPrice(order.pricing.subtotal)}</dd>
          </div>
          {order.pricing.discountAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-success">Discount</dt>
              <dd className="text-success">−{formatPrice(order.pricing.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="text-ink">
              {order.pricing.deliveryCharge === 0
                ? 'Free'
                : formatPrice(order.pricing.deliveryCharge)}
            </dd>
          </div>
          {order.pricing.taxAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Tax</dt>
              <dd className="text-ink">{formatPrice(order.pricing.taxAmount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-base font-bold text-ink">
          <span>Total</span>
          <span>{formatPrice(order.pricing.grandTotal)}</span>
        </div>
      </Card>
    </div>
  );
}
