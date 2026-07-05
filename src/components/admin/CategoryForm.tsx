'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { SlugInput } from '@/components/admin/SlugInput';
import { categorySchema, type CategoryInput } from '@/lib/validation/category';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export interface CategoryFormData {
  id?: string;
  name?: string;
  slug?: string;
  iconUrl?: string | null;
  displayOrder?: number;
  isHidden?: boolean;
}

export function CategoryForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: CategoryFormData;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [iconUrl, setIconUrl] = useState(initialData?.iconUrl ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(initialData?.displayOrder ?? 0));
  const [isHidden, setIsHidden] = useState(initialData?.isHidden ?? false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = categorySchema.safeParse({
      name,
      slug,
      iconUrl: iconUrl.trim() || null,
      displayOrder: Number(displayOrder) || 0,
      isHidden,
    } satisfies CategoryInput);

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiRequest(`/api/admin/categories/${initialData!.id}`, {
          method: 'PATCH',
          body: parsed.data,
        });
      } else {
        await apiRequest('/api/admin/categories', { body: parsed.data });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Category Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        required
      />

      <SlugInput
        value={slug}
        onChange={setSlug}
        sourceValue={name}
        error={fieldErrors.slug}
      />

      <Input
        label="Icon URL (optional)"
        type="url"
        placeholder="https://…"
        value={iconUrl}
        onChange={(event) => setIconUrl(event.target.value)}
        helperText="URL of a small icon image for the category pill."
      />

      <Input
        label="Display Order"
        type="number"
        inputMode="numeric"
        min={0}
        value={displayOrder}
        onChange={(event) => setDisplayOrder(event.target.value)}
        helperText="Lower numbers appear first. 0 is the default."
      />

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isHidden}
          onChange={(event) => setIsHidden(event.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
        />
        Hide this category from customers
      </label>

      <div className="flex justify-end gap-3 border-t border-border pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
