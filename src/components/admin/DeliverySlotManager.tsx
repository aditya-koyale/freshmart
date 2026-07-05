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

interface SlotRow {
  id: string; date: string; startTime: string; endTime: string;
  maxOrders: number; currentLoad: number; isDisabled: boolean;
}

function SlotForm({ initial, onSuccess, onCancel }: { initial?: SlotRow; onSuccess: () => void; onCancel: () => void; }) {
  const isEdit = Boolean(initial?.id);
  const [f, setF] = useState({
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '',
    startTime: initial?.startTime ?? '',
    endTime: initial?.endTime ?? '',
    maxOrders: String(initial?.maxOrders ?? '50'),
    isDisabled: initial?.isDisabled ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    const body = { date: f.date, startTime: f.startTime, endTime: f.endTime, maxOrders: parseInt(f.maxOrders, 10) || 50, isDisabled: f.isDisabled };
    setBusy(true);
    try {
      if (isEdit) await apiRequest(`/api/admin/delivery-slots/${initial!.id}`, { method: 'PATCH', body });
      else await apiRequest('/api/admin/delivery-slots', { body });
      onSuccess();
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Save failed.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
        <Input label="Max Orders" type="number" min={1} value={f.maxOrders} onChange={(e) => set('maxOrders', e.target.value)} required />
        <Input label="Start Time" type="time" value={f.startTime} onChange={(e) => set('startTime', e.target.value)} required />
        <Input label="End Time" type="time" value={f.endTime} onChange={(e) => set('endTime', e.target.value)} required />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={f.isDisabled} onChange={(e) => set('isDisabled', e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
        Disable this slot (prevent new orders)
      </label>
      <div className="flex justify-end gap-3 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" isLoading={busy}>{isEdit ? 'Save' : 'Create Slot'}</Button>
      </div>
    </form>
  );
}

export function DeliverySlotManager({ slots }: { slots: SlotRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SlotRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SlotRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function success() { setModalOpen(false); setEditTarget(undefined); router.refresh(); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/api/admin/delivery-slots/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null); router.refresh();
    } finally { setIsDeleting(false); }
  }

  async function toggleDisabled(slot: SlotRow) {
    try {
      await apiRequest(`/api/admin/delivery-slots/${slot.id}`, { method: 'PATCH', body: { isDisabled: !slot.isDisabled } });
      router.refresh();
    } catch {}
  }

  const columns: Column<SlotRow>[] = [
    { key: 'date', heading: 'Date', render: (r) => <span className="font-medium text-ink">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span> },
    { key: 'time', heading: 'Time Window', className: 'w-40', render: (r) => <span className="text-ink-muted">{r.startTime} – {r.endTime}</span> },
    { key: 'capacity', heading: 'Capacity', className: 'w-32', render: (r) => {
      const pct = r.maxOrders > 0 ? Math.round((r.currentLoad / r.maxOrders) * 100) : 0;
      return (<div><p className="text-sm text-ink">{r.currentLoad} / {r.maxOrders}</p><div className="mt-1 h-1.5 w-full rounded-full bg-border"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} /></div></div>);
    }},
    { key: 'status', heading: 'Status', className: 'w-28', render: (r) => (
      <button type="button" onClick={() => toggleDisabled(r)}>
        <Badge variant={r.isDisabled ? 'error' : r.currentLoad >= r.maxOrders ? 'warning' : 'success'}>
          {r.isDisabled ? 'Disabled' : r.currentLoad >= r.maxOrders ? 'Full' : 'Open'}
        </Badge>
      </button>
    )},
    { key: 'actions', heading: '', className: 'w-28 text-right', render: (r) => (
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => { setEditTarget(r); setModalOpen(true); }} className="text-xs font-medium text-primary hover:underline">Edit</button>
        <button type="button" onClick={() => setDeleteTarget(r)} className="text-xs font-medium text-error hover:underline">Delete</button>
      </div>
    )},
  ];

  return (
    <>
      <div className="flex flex-col gap-5">
        <PageHeader title="Delivery Slots" description={`${slots.length} upcoming slots`} action={<Button size="sm" onClick={() => { setEditTarget(undefined); setModalOpen(true); }}>+ New Slot</Button>} />
        <p className="text-sm text-ink-muted">Slots appear on the customer checkout page. Clicking the status badge toggles a slot open/disabled instantly.</p>
        <DataTable columns={columns} rows={slots} rowKey={(r) => r.id} emptyTitle="No delivery slots configured" emptyDescription="Create slots to let customers choose a delivery window at checkout." />
      </div>
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Slot' : 'New Delivery Slot'}>
        <SlotForm initial={editTarget} onSuccess={success} onCancel={() => setModalOpen(false)} />
      </AdminModal>
      <ConfirmDialog isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting}
        title="Delete this slot?" description="Any pending orders in this slot are unaffected; only the slot record is removed." confirmLabel="Delete Slot" />
    </>
  );
}
