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

interface CouponRow {
  id: string; code: string; type: 'PERCENTAGE' | 'FIXED';
  discountValue: number; minOrderValue: number | null;
  maxDiscount: number | null; usageLimit: number | null;
  usageCount: number; firstOrderOnly: boolean;
  startDate: string; endDate: string; isActive: boolean;
}

function CouponForm({ initial, onSuccess, onCancel }: {
  initial?: CouponRow;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    type: initial?.type ?? 'PERCENTAGE',
    discountValue: String(initial?.discountValue ?? ''),
    minOrderValue: String(initial?.minOrderValue ?? ''),
    maxDiscount: String(initial?.maxDiscount ?? ''),
    usageLimit: String(initial?.usageLimit ?? ''),
    firstOrderOnly: initial?.firstOrderOnly ?? false,
    startDate: initial?.startDate ? initial.startDate.slice(0, 16) : '',
    endDate: initial?.endDate ? initial.endDate.slice(0, 16) : '',
    isActive: initial?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: string, value: unknown) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    const body = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      discountValue: parseFloat(form.discountValue),
      minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      firstOrderOnly: form.firstOrderOnly,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
    };
    setBusy(true);
    try {
      if (isEdit) await apiRequest(`/api/admin/coupons/${initial!.id}`, { method: 'PATCH', body });
      else await apiRequest('/api/admin/coupons', { body });
      onSuccess();
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Save failed.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} required />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>
        <Input label={form.type === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹'} type="number" step="0.01" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} required />
        <Input label="Min Order Value (₹)" type="number" step="0.01" placeholder="No minimum" value={form.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />
        {form.type === 'PERCENTAGE' && (
          <Input label="Max Discount (₹)" type="number" step="0.01" placeholder="No cap" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
        )}
        <Input label="Usage Limit" type="number" placeholder="Unlimited" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
        <Input label="Start Date & Time" type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
        <Input label="End Date & Time" type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => set('firstOrderOnly', e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />First order only</label>
        <label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />Active</label>
      </div>
      <div className="flex justify-end gap-3 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" isLoading={busy}>{isEdit ? 'Save' : 'Create'}</Button>
      </div>
    </form>
  );
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function success() { setModalOpen(false); setEditTarget(undefined); router.refresh(); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true); setDeleteError(null);
    try {
      await apiRequest(`/api/admin/coupons/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null); router.refresh();
    } catch (err) { setDeleteError(err instanceof ApiRequestError ? err.message : 'Delete failed.'); }
    finally { setIsDeleting(false); }
  }

  const now = new Date();
  const columns: Column<CouponRow>[] = [
    { key: 'code', heading: 'Code', render: (r) => <span className="font-mono font-bold text-ink">{r.code}</span> },
    { key: 'discount', heading: 'Discount', render: (r) => <span>{r.type === 'PERCENTAGE' ? `${r.discountValue}%` : formatPrice(r.discountValue)}{r.maxDiscount ? ` (max ${formatPrice(r.maxDiscount)})` : ''}</span> },
    { key: 'min', heading: 'Min Order', className: 'w-28', render: (r) => <span className="text-ink-muted">{r.minOrderValue ? formatPrice(r.minOrderValue) : '—'}</span> },
    { key: 'usage', heading: 'Usage', className: 'w-28', render: (r) => <span className="text-ink-muted">{r.usageCount}{r.usageLimit ? ` / ${r.usageLimit}` : ''}</span> },
    { key: 'validity', heading: 'Valid', className: 'w-32', render: (r) => {
      const expired = new Date(r.endDate) < now;
      const notStarted = new Date(r.startDate) > now;
      return <Badge variant={!r.isActive || expired ? 'error' : notStarted ? 'warning' : 'success'}>{!r.isActive ? 'Inactive' : expired ? 'Expired' : notStarted ? 'Scheduled' : 'Active'}</Badge>;
    }},
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
        <PageHeader title="Coupons" description={`${coupons.length} total`} action={<Button size="sm" onClick={() => { setEditTarget(undefined); setModalOpen(true); }}>+ New Coupon</Button>} />
        <DataTable columns={columns} rows={coupons} rowKey={(r) => r.id} emptyTitle="No coupons yet" emptyDescription="Create a coupon to offer discounts to customers." />
      </div>
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Coupon' : 'New Coupon'} size="lg">
        <CouponForm initial={editTarget} onSuccess={success} onCancel={() => setModalOpen(false)} />
      </AdminModal>
      <ConfirmDialog isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting}
        title={`Delete "${deleteTarget?.code}"?`} description={deleteError ?? 'This coupon will be permanently deactivated and hidden.'} confirmLabel="Delete Coupon" />
    </>
  );
}
