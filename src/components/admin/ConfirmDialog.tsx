'use client';

import { Button } from '@/components/ui/Button';
import { AdminModal } from '@/components/admin/AdminModal';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  isDestructive = true,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          size="sm"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </AdminModal>
  );
}
