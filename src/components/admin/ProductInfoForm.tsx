'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { SlugInput } from '@/components/admin/SlugInput';
import { productUpdateSchema } from '@/lib/validation/product';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

interface CategoryOption { id: string; name: string }

export function ProductInfoForm({
  productId,
  initial,
  categories,
}: {
  productId: string;
  initial: {
    categoryId: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    sku: string | null;
    origin: string | null;
    freshnessInfo: string | null;
    storageInfo: string | null;
    isFeatured: boolean;
    isBestSeller: boolean;
    isSeasonal: boolean;
    isNewArrival: boolean;
    isActive: boolean;
  };
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [sku, setSku] = useState(initial.sku ?? '');
  const [origin, setOrigin] = useState(initial.origin ?? '');
  const [freshnessInfo, setFreshnessInfo] = useState(initial.freshnessInfo ?? '');
  const [storageInfo, setStorageInfo] = useState(initial.storageInfo ?? '');
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [isBestSeller, setIsBestSeller] = useState(initial.isBestSeller);
  const [isSeasonal, setIsSeasonal] = useState(initial.isSeasonal);
  const [isNewArrival, setIsNewArrival] = useState(initial.isNewArrival);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const payload = {
      categoryId, name, slug,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      sku: sku.trim() || null,
      origin: origin.trim() || null,
      freshnessInfo: freshnessInfo.trim() || null,
      storageInfo: storageInfo.trim() || null,
      isFeatured, isBestSeller, isSeasonal, isNewArrival, isActive,
    };

    const parsed = productUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: parsed.data,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Changes saved.</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <SlugInput value={slug} onChange={setSlug} sourceValue={name} />

      <Input label="Short Description" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} helperText="Max 160 characters." />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Full Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        <Input label="Freshness Info" value={freshnessInfo} onChange={(e) => setFreshnessInfo(e.target.value)} />
        <Input label="Storage Tips" value={storageInfo} onChange={(e) => setStorageInfo(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Featured', value: isFeatured, set: setIsFeatured },
          { label: 'Best Seller', value: isBestSeller, set: setIsBestSeller },
          { label: 'Seasonal', value: isSeasonal, set: setIsSeasonal },
          { label: 'New Arrival', value: isNewArrival, set: setIsNewArrival },
          { label: 'Active', value: isActive, set: setIsActive },
        ].map((flag) => (
          <label key={flag.label} className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={flag.value}
              onChange={(e) => flag.set(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
            />
            {flag.label}
          </label>
        ))}
      </div>

      <div className="flex justify-end border-t border-border pt-3">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
