'use client';

import { Input } from '@/components/ui/Input';
import { generateSlug } from '@/utils/slug';

export function SlugInput({
  value,
  onChange,
  sourceValue,
  error,
  disabled,
}: {
  value: string;
  onChange: (slug: string) => void;
  sourceValue: string; // the "name" field value used for auto-generation
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Slug"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            error={error}
            helperText="Used in the URL. Letters, numbers, and hyphens only."
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          disabled={disabled || !sourceValue.trim()}
          onClick={() => onChange(generateSlug(sourceValue))}
          className="mb-[1px] h-11 rounded-control border border-border px-3 text-xs font-medium text-ink-muted hover:bg-surface-subtle disabled:opacity-50"
        >
          Auto
        </button>
      </div>
    </div>
  );
}
