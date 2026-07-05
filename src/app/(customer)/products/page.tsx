import type { Metadata } from 'next';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { PaginationControls } from '@/components/customer/PaginationControls';
import { CategoryFilter } from '@/components/customer/CategoryFilter';
import { listPublicCategories } from '@/services/categoryService';
import { listPublicProducts } from '@/services/productService';
import { productListQuerySchema } from '@/lib/validation/product';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Browse the full FreshMart fruit catalog.',
};

interface ProductsPageProps {
  searchParams: {
    category?: string;
    featured?: string;
    bestSeller?: string;
    seasonal?: string;
    newArrival?: string;
    page?: string;
  };
}

const FLAG_LABELS: Record<string, string> = {
  featured: 'Featured',
  bestSeller: 'Best Sellers',
  seasonal: 'In Season',
  newArrival: 'New Arrivals',
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = productListQuerySchema.parse({
    categorySlug: searchParams.category,
    featured: searchParams.featured,
    bestSeller: searchParams.bestSeller,
    seasonal: searchParams.seasonal,
    newArrival: searchParams.newArrival,
    page: searchParams.page,
  });

  const [categories, { items, pagination }] = await Promise.all([
    listPublicCategories(),
    listPublicProducts(query),
  ]);

  const activeFlag = Object.entries(FLAG_LABELS).find(
    ([key]) => searchParams[key as keyof typeof searchParams] === 'true',
  );

  const categoryPills = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    iconUrl: category.iconUrl,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        {activeFlag ? activeFlag[1] : 'Shop All Products'}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
      </p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <CategoryFilter categories={categoryPills} />
        </aside>

        <div className="flex-1">
          <ProductGrid
            products={items}
            emptyTitle="No products match these filters"
            emptyDescription="Try a different category or clear your filters."
          />
          <PaginationControls page={pagination.page} totalPages={pagination.totalPages} />
        </div>
      </div>
    </div>
  );
}
