'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/admin/PageHeader';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import { formatPrice } from '@/utils/format';

interface AreaRow {
  id: string; pinCode: string; areaName: string;
  deliveryCharge: number; freeDeliveryAbove: number | null;
  minOrderValue: number; estimatedMinutes: number; isActive: boolean;
}

function AreaForm({ initial, onSuccess, onCancel }: { initial?: AreaRow; onSuccess: () => void; onCancel: () => void; }) {
  const isEdit = Boolean(initial?.id);
  const [f, setF] = useState({
    pinCode: initial?.pinCode ?? '', areaName: initial?.areaName ?? '',
    deliveryCharge: String(initial?.deliveryCharge ?? '0'),
    freeDeliveryAbove: String(initial?.freeDeliveryAbove ?? ''),
    minOrderValue: String(initial?.minOrderValue ?? '0'),
    estimatedMinutes: String(initial?.estimatedMinutes ?? '60'),
    isActive: initial?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    const body = {
      pinCode: f.pinCode.trim(), areaName: f.areaName.trim(),
      deliveryCharge: parseFloat(f.deliveryCharge) || 0,
      freeDeliveryAbove: f.freeDeliveryAbove ? parseFloat(f.freeDeliveryAbove) : null,
      minOrderValue: parseFloat(f.minOrderValue) || 0,
      estimatedMinutes: parseInt(f.estimatedMinutes, 10) || 60,
      isActive: f.isActive,
    };
    setBusy(true);
    try {
      if (isEdit) await apiRequest(`/api/admin/delivery-areas/${initial!.id}`, { method: 'PATCH', body });
      else await apiRequest('/api/admin/delivery-areas', { body });
      onSuccess();
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Save failed.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="PIN Code" value={f.pinCode} onChange={(e) => set('pinCode', e.target.value)} disabled={isEdit} required />
        <Input label="Area Name" value={f.areaName} onChange={(e) => set('areaName', e.target.value)} required />
        <Input label="Delivery Charge (₹)" type="number" step="0.01" value={f.deliveryCharge} onChange={(e) => set('deliveryCharge', e.target.value)} />
        <Input label="Free Delivery Above (₹)" type="number" step="0.01" placeholder="No free delivery" value={f.freeDeliveryAbove} onChange={(e) => set('freeDeliveryAbove', e.target.value)} />
        <Input label="Min Order Value (₹)" type="number" step="0.01" value={f.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />
        <Input label="Est. Delivery (minutes)" type="number" value={f.estimatedMinutes} onChange={(e) => set('estimatedMinutes', e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />Active
      </label>
      <div className="flex justify-end gap-3 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" isLoading={busy}>{isEdit ? 'Save' : 'Add Area'}</Button>
      </div>
    </form>
  );
}

export function DeliveryAreaManager({ areas }: { areas: AreaRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AreaRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AreaRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function success() { setModalOpen(false); setEditTarget(undefined); router.refresh(); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true); setDeleteError(null);
    try {
      await apiRequest(`/api/admin/delivery-areas/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null); router.refresh();
    } catch (err) { setDeleteError(err instanceof ApiRequestError ? err.message : 'Delete failed.'); }
    finally { setIsDeleting(false); }
  }

  const columns: Column<AreaRow>[] = [
    { key: 'pin', heading: 'PIN / Area', render: (r) => (<div><p className="font-mono font-bold text-ink">{r.pinCode}</p><p className="text-xs text-ink-muted">{r.areaName}</p></div>) },
    { key: 'charge', heading: 'Delivery Charge', className: 'w-36', render: (r) => (<div><p className="text-ink">{r.deliveryCharge === 0 ? 'Free' : formatPrice(r.deliveryCharge)}</p>{r.freeDeliveryAbove && <p className="text-xs text-ink-faint">Free above {formatPrice(r.freeDeliveryAbove)}</p>}</div>) },
    { key: 'min', heading: 'Min Order', className: 'w-28', render: (r) => <span className="text-ink-muted">{r.minOrderValue > 0 ? formatPrice(r.minOrderValue) : '—'}</span> },
    { key: 'eta', heading: 'ETA', className: 'w-24', render: (r) => <span className="text-ink-muted">{r.estimatedMinutes} min</span> },
    { key: 'status', heading: 'Status', className: 'w-24', render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', heading: '', className: 'w-28 text-right', render: (r) => (
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => { setEditTarget(r); setModalOpen(true); }} className="text-xs font-medium text-primary hover:underline">Edit</button>
        <button type="button" onClick={() => { setDeleteError(null); setDeleteTarget(r); }} className="text-xs font-medium text-error hover:underline">Delete</button>
      </div>
    )},
  ];

  return (
    <>
      <div className="flex flex-col gap-5">
        <PageHeader title="Delivery Areas" description={`${areas.length} PIN codes configured`} action={<Button size="sm" onClick={() => { setEditTarget(undefined); setModalOpen(true); }}>+ Add PIN Code</Button>} />
        <p className="text-sm text-ink-muted">These PIN codes determine where FreshMart delivers and the applicable charges. Checkout blocks orders to unconfigured PIN codes.</p>
        <DataTable columns={columns} rows={areas} rowKey={(r) => r.id} emptyTitle="No delivery areas configured" emptyDescription="Add PIN codes to enable customer checkout in those areas." />
      </div>
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Delivery Area' : 'Add Delivery Area'}>
        <AreaForm initial={editTarget} onSuccess={success} onCancel={() => setModalOpen(false)} />
      </AdminModal>
      <ConfirmDialog isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting}
        title={`Remove PIN ${deleteTarget?.pinCode}?`} description={deleteError ?? 'Customers in this area will no longer be able to check out.'} confirmLabel="Remove Area" />
    </>
  );
}
