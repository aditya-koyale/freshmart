'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import type { OrderStatus } from '@prisma/client';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const ACTION_LABELS: Record<OrderStatus, string> = {
  CONFIRMED: 'Confirm Order',
  PREPARING: 'Mark as Preparing',
  PACKED: 'Mark as Packed',
  OUT_FOR_DELIVERY: 'Mark Out for Delivery',
  DELIVERED: 'Mark as Delivered',
  CANCELLED: 'Cancel Order',
  REFUNDED: 'Process Refund',
  PENDING: 'Revert to Pending',
};

const DESTRUCTIVE: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  validNextStatuses,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  validNextStatuses: OrderStatus[];
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<OrderStatus | null>(null);

  async function handleTransition(newStatus: OrderStatus) {
    setError(null);
    setLoadingStatus(newStatus);
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus, note: note.trim() || undefined },
      });
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Status update failed.');
    } finally {
      setLoadingStatus(null);
    }
  }

  if (validNextStatuses.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No further transitions available for{' '}
        <strong>{STATUS_LABELS[currentStatus]}</strong>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label htmlFor="status-note" className="mb-1.5 block text-sm font-medium text-ink">
          Note (optional)
        </label>
        <input
          id="status-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal note for this status change…"
          className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {validNextStatuses.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={DESTRUCTIVE.includes(status) ? 'danger' : 'primary'}
            isLoading={loadingStatus === status}
            disabled={loadingStatus !== null}
            onClick={() => handleTransition(status)}
          >
            {ACTION_LABELS[status] ?? STATUS_LABELS[status]}
          </Button>
        ))}
      </div>
    </div>
  );
}
