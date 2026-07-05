import type { Metadata } from 'next';
import { CategoryPill } from '@/components/customer/CategoryPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPublicCategories } from '@/services/categoryService';

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Browse all fruit categories available on FreshMart.',
};

export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await listPublicCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Shop by Category</h1>

      {categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No categories yet"
            description="Categories will appear here once they're added by the FreshMart team."
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((category) => (
            <CategoryPill
              key={category.slug}
              category={{
                slug: category.slug,
                name: category.name,
                iconUrl: category.iconUrl,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
