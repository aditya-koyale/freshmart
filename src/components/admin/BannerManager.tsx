'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/admin/PageHeader';
import { ApiRequestError } from '@/lib/api-client';

interface BannerRow {
  id: string; imageUrl: string; title: string | null; subtitle: string | null;
  buttonText: string | null; destinationLink: string | null;
  displayOrder: number; isActive: boolean;
  startDate: string | null; endDate: string | null;
}

function BannerForm({ initial, onSuccess, onCancel }: { initial?: BannerRow; onSuccess: () => void; onCancel: () => void; }) {
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [buttonText, setButtonText] = useState(initial?.buttonText ?? '');
  const [destinationLink, setDestinationLink] = useState(initial?.destinationLink ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(initial?.displayOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    const file = fileRef.current?.files?.[0];
    if (!isEdit && !file) { setError('Please select a banner image.'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('title', title); fd.append('subtitle', subtitle);
      fd.append('buttonText', buttonText); fd.append('destinationLink', destinationLink);
      fd.append('displayOrder', displayOrder); fd.append('isActive', String(isActive));
      const url = isEdit ? `/api/admin/banners/${initial!.id}` : '/api/admin/banners';
      const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? 'Save failed.');
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {isEdit ? 'Replace Image (optional)' : 'Banner Image *'}
        </label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary" />
      </div>
      {initial?.imageUrl && (
        <div className="relative h-24 w-full overflow-hidden rounded-control bg-surface-subtle">
          <Image src={initial.imageUrl} alt="Current banner" fill className="object-cover" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <Input label="Button Text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
        <Input label="Link URL" value={destinationLink} onChange={(e) => setDestinationLink(e.target.value)} />
        <Input label="Display Order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
            Active
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" isLoading={busy}>{isEdit ? 'Save' : 'Upload Banner'}</Button>
      </div>
    </form>
  );
}

export function BannerManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BannerRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function success() { setModalOpen(false); setEditTarget(undefined); router.refresh(); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/admin/banners/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null); router.refresh();
    } finally { setIsDeleting(false); }
  }

  const columns: Column<BannerRow>[] = [
    { key: 'image', heading: 'Image', className: 'w-24', render: (r) => (
      <div className="relative h-12 w-20 overflow-hidden rounded-control bg-surface-subtle">
        <Image src={r.imageUrl} alt={r.title ?? 'Banner'} fill sizes="80px" className="object-cover" />
      </div>
    )},
    { key: 'title', heading: 'Title', render: (r) => (
      <div>
        <p className="font-medium text-ink">{r.title || <span className="italic text-ink-faint">No title</span>}</p>
        {r.destinationLink && <p className="truncate text-xs text-ink-faint max-w-xs">{r.destinationLink}</p>}
      </div>
    )},
    { key: 'order', heading: 'Order', className: 'w-16 text-center', render: (r) => <span className="text-ink-muted">{r.displayOrder}</span> },
    { key: 'status', heading: 'Status', className: 'w-24', render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
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
        <PageHeader title="Banners" description={`${banners.length} banners`} action={<Button size="sm" onClick={() => { setEditTarget(undefined); setModalOpen(true); }}>+ Upload Banner</Button>} />
        <DataTable columns={columns} rows={banners} rowKey={(r) => r.id} emptyTitle="No banners yet" emptyDescription="Upload a banner image to display on the homepage." />
      </div>
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Banner' : 'New Banner'} size="lg">
        <BannerForm initial={editTarget} onSuccess={success} onCancel={() => setModalOpen(false)} />
      </AdminModal>
      <ConfirmDialog isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting}
        title={`Delete banner "${deleteTarget?.title ?? 'this banner'}"?`} description="This banner will be permanently removed." confirmLabel="Delete Banner" />
    </>
  );
}
