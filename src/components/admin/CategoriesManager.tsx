'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CategoryForm, type CategoryFormData } from '@/components/admin/CategoryForm';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
  isHidden: boolean;
}

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<CategoryFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setModalMode('create');
  }

  function openEdit(category: CategoryRow) {
    setEditTarget(category);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

  function handleSuccess() {
    closeModal();
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await apiRequest(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: Column<CategoryRow>[] = [
    {
      key: 'name',
      heading: 'Category',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.name}</p>
          <p className="text-xs text-ink-faint">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'order',
      heading: 'Order',
      className: 'w-20 text-right',
      render: (row) => <span className="text-ink-muted">{row.displayOrder}</span>,
    },
    {
      key: 'status',
      heading: 'Status',
      className: 'w-28',
      render: (row) =>
        row.isHidden ? (
          <Badge variant="neutral">Hidden</Badge>
        ) : (
          <Badge variant="success">Visible</Badge>
        ),
    },
    {
      key: 'actions',
      heading: '',
      className: 'w-32 text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => { setDeleteError(null); setDeleteTarget(row); }}
            className="text-xs font-medium text-error hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Categories</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + New Category
        </Button>
      </div>

      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={categories}
          rowKey={(row) => row.id}
          emptyTitle="No categories yet"
          emptyDescription="Create your first category to start organising products."
        />
      </div>

      <AdminModal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit Category' : 'New Category'}
      >
        <CategoryForm
          initialData={editTarget ?? undefined}
          onSuccess={handleSuccess}
          onCancel={closeModal}
        />
      </AdminModal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={`Delete "${deleteTarget?.name}"?`}
        description={
          deleteError ??
          'This category will be soft-deleted. This action is blocked if the category has active products.'
        }
        confirmLabel="Delete Category"
      />
    </>
  );
}
