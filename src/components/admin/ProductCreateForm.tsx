'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { SlugInput } from '@/components/admin/SlugInput';
import {
  WeightVariantManagerCreate,
  type LocalVariant,
} from '@/components/admin/WeightVariantManager';
import { productSchema } from '@/lib/validation/product';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

interface CategoryOption {
  id: string;
  name: string;
}

export function ProductCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [origin, setOrigin] = useState('');
  const [freshnessInfo, setFreshnessInfo] = useState('');
  const [storageInfo, setStorageInfo] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isSeasonal, setIsSeasonal] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<LocalVariant[]>([
    { tempId: 'initial', label: '', price: '', salePrice: '', initialStock: 0, lowStockThreshold: 10 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildVariantPayloads() {
    return variants.map((v) => ({
      label: v.label,
      price: parseFloat(v.price) || 0,
      salePrice: v.salePrice.trim() ? parseFloat(v.salePrice) : null,
      initialStock: v.initialStock,
      lowStockThreshold: v.lowStockThreshold,
      isActive: true,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      categoryId,
      name,
      slug,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      sku: sku.trim() || null,
      origin: origin.trim() || null,
      freshnessInfo: freshnessInfo.trim() || null,
      storageInfo: storageInfo.trim() || null,
      isFeatured,
      isBestSeller,
      isSeasonal,
      isNewArrival,
      isActive,
      weightVariants: buildVariantPayloads(),
    };

    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      // Show first error for general context
      const firstMessage = parsed.error.issues[0]?.message;
      if (firstMessage) setError(`Please fix: ${firstMessage}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ id: string }>('/api/admin/products', {
        body: parsed.data,
      });
      router.push(`/admin/products/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not create product.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Basic Info */}
      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-ink">Basic Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SlugInput
          value={slug}
          onChange={setSlug}
          sourceValue={name}
          error={fieldErrors.slug}
        />

        <Input
          label="Short Description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          helperText="Shown on product cards. Max 160 characters."
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Full Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Detailed product description…"
          />
        </div>
      </section>

      {/* Details */}
      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-ink">Product Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input label="Origin (optional)" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Maharashtra" />
          <Input label="Freshness Info (optional)" value={freshnessInfo} onChange={(e) => setFreshnessInfo(e.target.value)} placeholder="e.g. Lasts 3–4 days" />
          <Input label="Storage Tips (optional)" value={storageInfo} onChange={(e) => setStorageInfo(e.target.value)} placeholder="e.g. Store in fridge" />
        </div>
      </section>

      {/* Flags */}
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-ink">Labels & Visibility</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Featured', value: isFeatured, set: setIsFeatured },
            { label: 'Best Seller', value: isBestSeller, set: setIsBestSeller },
            { label: 'Seasonal', value: isSeasonal, set: setIsSeasonal },
            { label: 'New Arrival', value: isNewArrival, set: setIsNewArrival },
            { label: 'Active (visible to customers)', value: isActive, set: setIsActive },
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
      </section>

      {/* Weight Variants */}
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-sm font-semibold text-ink">Weight Variants</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            At least one variant is required. Images can be added after the product is created.
          </p>
        </div>
        {fieldErrors['weightVariants'] && (
          <p className="text-xs text-error">{fieldErrors['weightVariants']}</p>
        )}
        <WeightVariantManagerCreate variants={variants} onChange={setVariants} />
      </section>

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          Create Product
        </Button>
        <Button variant="outline" href="/admin/products">
          Cancel
        </Button>
      </div>
    </form>
  );
}
