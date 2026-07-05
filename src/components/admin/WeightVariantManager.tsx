'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { InventoryAdjustModal } from '@/components/admin/InventoryAdjustModal';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

// ── Create-mode types ──────────────────────────────────────────────────────────

export interface LocalVariant {
  tempId: string;
  label: string;
  price: string;
  salePrice: string;
  initialStock: number;
  lowStockThreshold: number;
}

function emptyLocalVariant(): LocalVariant {
  return {
    tempId: Math.random().toString(36).slice(2),
    label: '',
    price: '',
    salePrice: '',
    initialStock: 0,
    lowStockThreshold: 10,
  };
}

// ── Edit-mode types ────────────────────────────────────────────────────────────

export interface ExistingVariant {
  id: string;
  label: string;
  price: number;
  salePrice: number | null;
  isActive: boolean;
  inventory: {
    id: string;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
  } | null;
}

// ── Create mode ────────────────────────────────────────────────────────────────

function CreateModeVariantRow({
  variant,
  onChange,
  onRemove,
  canRemove,
}: {
  variant: LocalVariant;
  onChange: (updated: LocalVariant) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function set<K extends keyof LocalVariant>(key: K, value: LocalVariant[K]) {
    onChange({ ...variant, [key]: value });
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-control border border-border p-3 sm:grid-cols-4">
      <Input
        label="Label"
        placeholder="e.g. 500g"
        value={variant.label}
        onChange={(e) => set('label', e.target.value)}
        required
      />
      <Input
        label="Price (₹)"
        type="number"
        inputMode="decimal"
        min={0.01}
        step={0.01}
        placeholder="0.00"
        value={variant.price}
        onChange={(e) => set('price', e.target.value)}
        required
      />
      <Input
        label="Sale Price (₹)"
        type="number"
        inputMode="decimal"
        min={0.01}
        step={0.01}
        placeholder="Optional"
        value={variant.salePrice}
        onChange={(e) => set('salePrice', e.target.value)}
      />
      <Input
        label="Initial Stock"
        type="number"
        inputMode="numeric"
        min={0}
        value={String(variant.initialStock)}
        onChange={(e) => set('initialStock', parseInt(e.target.value, 10) || 0)}
      />
      {canRemove && (
        <div className="col-span-2 flex justify-end sm:col-span-4">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-error hover:underline"
          >
            Remove variant
          </button>
        </div>
      )}
    </div>
  );
}

export function WeightVariantManagerCreate({
  variants,
  onChange,
}: {
  variants: LocalVariant[];
  onChange: (variants: LocalVariant[]) => void;
}) {
  function addVariant() {
    onChange([...variants, emptyLocalVariant()]);
  }

  function updateVariant(tempId: string, updated: LocalVariant) {
    onChange(variants.map((v) => (v.tempId === tempId ? updated : v)));
  }

  function removeVariant(tempId: string) {
    onChange(variants.filter((v) => v.tempId !== tempId));
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant) => (
        <CreateModeVariantRow
          key={variant.tempId}
          variant={variant}
          onChange={(updated) => updateVariant(variant.tempId, updated)}
          onRemove={() => removeVariant(variant.tempId)}
          canRemove={variants.length > 1}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addVariant} className="self-start">
        + Add Weight Variant
      </Button>
    </div>
  );
}

// ── Edit mode ──────────────────────────────────────────────────────────────────

function EditVariantRow({
  variant,
  productId,
  onRefresh,
}: {
  variant: ExistingVariant;
  productId: string;
  onRefresh: () => void;
}) {
  const [editLabel, setEditLabel] = useState(variant.label);
  const [editPrice, setEditPrice] = useState(String(variant.price));
  const [editSalePrice, setEditSalePrice] = useState(String(variant.salePrice ?? ''));
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  function markDirty() {
    setIsDirty(true);
    setRowError(null);
  }

  async function handleSave() {
    setRowError(null);
    const priceNum = parseFloat(editPrice);
    const salePriceNum = editSalePrice.trim() ? parseFloat(editSalePrice) : null;

    if (isNaN(priceNum) || priceNum <= 0) {
      setRowError('Price must be a positive number.');
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: 'PATCH',
        body: { label: editLabel, price: priceNum, salePrice: salePriceNum },
      });
      setIsDirty(false);
      onRefresh();
    } catch (err) {
      setRowError(err instanceof ApiRequestError ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    try {
      await apiRequest(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: 'PATCH',
        body: { isActive: !variant.isActive },
      });
      onRefresh();
    } catch (err) {
      setRowError(err instanceof ApiRequestError ? err.message : 'Toggle failed.');
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await apiRequest(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: 'DELETE',
      });
      onRefresh();
    } catch (err) {
      setRowError(err instanceof ApiRequestError ? err.message : 'Delete failed.');
      setIsDeleting(false);
    }
  }

  const availableStock = variant.inventory
    ? variant.inventory.stock - variant.inventory.reservedStock
    : 0;

  return (
    <div
      className={clsx(
        'rounded-control border p-3',
        variant.isActive ? 'border-border' : 'border-border bg-surface-subtle opacity-70',
      )}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input
          label="Label"
          value={editLabel}
          onChange={(e) => { setEditLabel(e.target.value); markDirty(); }}
        />
        <Input
          label="Price (₹)"
          type="number"
          step={0.01}
          value={editPrice}
          onChange={(e) => { setEditPrice(e.target.value); markDirty(); }}
        />
        <Input
          label="Sale Price (₹)"
          type="number"
          step={0.01}
          placeholder="None"
          value={editSalePrice}
          onChange={(e) => { setEditSalePrice(e.target.value); markDirty(); }}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Stock</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink">
              {availableStock}{' '}
              <span className="text-ink-faint">/ {variant.inventory?.stock ?? 0}</span>
            </span>
            {variant.inventory && (
              <Badge
                variant={
                  availableStock === 0
                    ? 'error'
                    : availableStock <= (variant.inventory.lowStockThreshold)
                    ? 'warning'
                    : 'success'
                }
              >
                {availableStock === 0 ? 'Out' : availableStock <= variant.inventory.lowStockThreshold ? 'Low' : 'OK'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {rowError && <p className="mt-2 text-xs text-error">{rowError}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {isDirty && (
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        )}
        {variant.inventory && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdjust(true)}
          >
            Adjust Stock
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleActive}
        >
          {variant.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-error hover:bg-error/10"
        >
          Remove
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Remove Variant"
        description={`Remove "${variant.label}"? If this variant has order history it will be deactivated instead.`}
        confirmLabel="Remove"
      />

      {variant.inventory && (
        <InventoryAdjustModal
          isOpen={showAdjust}
          onClose={() => setShowAdjust(false)}
          onSuccess={() => { setShowAdjust(false); onRefresh(); }}
          inventoryId={variant.inventory.id}
          variantLabel={variant.label}
          currentStock={variant.inventory.stock}
        />
      )}
    </div>
  );
}

export function WeightVariantManagerEdit({
  variants,
  productId,
  onRefresh,
}: {
  variants: ExistingVariant[];
  productId: string;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  // Individual row components also call this; define once here
  const refresh = onRefresh ?? (() => router.refresh());
  const [showAdd, setShowAdd] = useState(false);
  const [newVariant, setNewVariant] = useState<LocalVariant>(emptyLocalVariant());
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAddVariant() {
    setAddError(null);
    const priceNum = parseFloat(newVariant.price);
    if (!newVariant.label.trim()) { setAddError('Label is required.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setAddError('Price must be a positive number.'); return; }

    const salePriceNum = newVariant.salePrice.trim() ? parseFloat(newVariant.salePrice) : null;

    setIsAdding(true);
    try {
      await apiRequest(`/api/admin/products/${productId}/variants`, {
        body: {
          label: newVariant.label,
          price: priceNum,
          salePrice: salePriceNum,
          initialStock: newVariant.initialStock,
          lowStockThreshold: newVariant.lowStockThreshold,
        },
      });
      setNewVariant(emptyLocalVariant());
      setShowAdd(false);
      refresh();
    } catch (err) {
      setAddError(err instanceof ApiRequestError ? err.message : 'Could not add variant.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant) => (
        <EditVariantRow
          key={variant.id}
          variant={variant}
          productId={productId}
          onRefresh={refresh}
        />
      ))}

      {showAdd ? (
        <div className="flex flex-col gap-3 rounded-control border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium text-ink">New Variant</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input label="Label" placeholder="e.g. 1kg" value={newVariant.label} onChange={(e) => setNewVariant({ ...newVariant, label: e.target.value })} />
            <Input label="Price (₹)" type="number" step={0.01} value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })} />
            <Input label="Sale Price (₹)" type="number" step={0.01} placeholder="None" value={newVariant.salePrice} onChange={(e) => setNewVariant({ ...newVariant, salePrice: e.target.value })} />
            <Input label="Initial Stock" type="number" min={0} value={String(newVariant.initialStock)} onChange={(e) => setNewVariant({ ...newVariant, initialStock: parseInt(e.target.value, 10) || 0 })} />
          </div>
          {addError && <Alert variant="error">{addError}</Alert>}
          <div className="flex gap-2">
            <Button size="sm" isLoading={isAdding} onClick={handleAddVariant}>Add Variant</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewVariant(emptyLocalVariant()); setAddError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setShowAdd(true)}>
          + Add Weight Variant
        </Button>
      )}
    </div>
  );
}
