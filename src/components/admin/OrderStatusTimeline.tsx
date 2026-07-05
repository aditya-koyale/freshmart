import clsx from 'clsx';
import type { OrderStatus } from '@prisma/client';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

interface HistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
}

/**
 * Vertical timeline of every status the order has passed through, with
 * current status highlighted and any admin notes shown inline.
 */
export function OrderStatusTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <ol className="relative flex flex-col gap-0">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const isCancelled = entry.status === 'CANCELLED' || entry.status === 'REFUNDED';

        return (
          <li key={entry.id} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                  isLast && isCancelled
                    ? 'border-error bg-error text-white'
                    : isLast
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-ink-faint',
                )}
              >
                {isLast ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className={clsx('pb-5', isLast && 'pb-0')}>
              <p
                className={clsx(
                  'text-sm font-semibold',
                  isLast && !isCancelled ? 'text-primary' : isLast && isCancelled ? 'text-error' : 'text-ink-muted',
                )}
              >
                {STATUS_LABELS[entry.status]}
              </p>
              <p className="text-xs text-ink-faint">
                {new Date(entry.createdAt).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                })}
              </p>
              {entry.note && (
                <p className="mt-1 text-xs text-ink-muted">{entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
