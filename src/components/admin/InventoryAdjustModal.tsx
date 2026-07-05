'use client';

import { useState, type FormEvent } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export function InventoryAdjustModal({
  isOpen,
  onClose,
  onSuccess,
  inventoryId,
  variantLabel,
  currentStock,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryId: string;
  variantLabel: string;
  currentStock: number;
}) {
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedChange = parseInt(change, 10);
  const newStock = isNaN(parsedChange) ? currentStock : currentStock + parsedChange;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isNaN(parsedChange) || parsedChange === 0) {
      setError('Enter a non-zero adjustment amount.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/admin/inventory/${inventoryId}/adjust`, {
        body: { change: parsedChange, reason: reason.trim() },
      });
      setChange('');
      setReason('');
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Adjustment failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock — ${variantLabel}`}
      size="sm"
    >
      <p className="mb-4 text-sm text-ink-muted">
        Current stock: <strong className="text-ink">{currentStock}</strong>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Adjustment (+ to add, − to remove)"
          type="number"
          placeholder="e.g. 50 or -10"
          value={change}
          onChange={(e) => setChange(e.target.value)}
          helperText={
            !isNaN(parsedChange) && parsedChange !== 0
              ? `New stock will be: ${newStock}`
              : undefined
          }
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          >
            <option value="">Select a reason…</option>
            <option value="MANUAL_ADJUSTMENT">Manual adjustment</option>
            <option value="STOCK_RECEIVED">New stock received</option>
            <option value="DAMAGED_GOODS">Damaged / spoiled goods</option>
            <option value="STOCK_CORRECTION">Stock count correction</option>
            <option value="RETURNED_TO_SUPPLIER">Returned to supplier</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Apply Adjustment
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
