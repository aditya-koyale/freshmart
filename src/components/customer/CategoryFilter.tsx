'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { CategoryPillData } from '@/components/customer/CategoryPill';

/**
 * Native <select> rather than a custom dropdown — fully keyboard and
 * screen-reader accessible by default, no extra ARIA wiring needed.
 */
export function CategoryFilter({ categories }: { categories: CategoryPillData[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') ?? '';

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) {
      params.set('category', event.target.value);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="category-filter" className="text-sm font-medium text-ink">
        Category
      </label>
      <select
        id="category-filter"
        value={currentCategory}
        onChange={handleChange}
        className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
