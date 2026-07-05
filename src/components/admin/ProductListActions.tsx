'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export function ProductStatusToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await apiRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: { isActive: !isActive },
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
        isActive ? 'bg-success' : 'bg-ink/20'
      }`}
      aria-label={isActive ? 'Deactivate product' : 'Activate product'}
      role="switch"
      aria-checked={isActive}
    >
      <span
        className={`h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
          isActive ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

export function ProductDeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await apiRequest(`/api/admin/products/${productId}`, { method: 'DELETE' });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed.');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-error hover:underline"
      >
        Delete
      </button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => { setOpen(false); setError(null); }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={`Delete "${productName}"?`}
        description={error ?? 'The product will be soft-deleted and hidden from customers.'}
        confirmLabel="Delete Product"
      />
    </>
  );
}
