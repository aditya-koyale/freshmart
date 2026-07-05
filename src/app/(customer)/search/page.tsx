import type { Metadata } from 'next';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { PaginationControls } from '@/components/customer/PaginationControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPublicProducts } from '@/services/productService';
import { productListQuerySchema } from '@/lib/validation/product';

interface SearchPageProps {
  searchParams: { q?: string; page?: string };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  return {
    title: searchParams.q ? `Search: ${searchParams.q}` : 'Search',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams.q?.trim() ?? '';

  if (!rawQuery) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Search FreshMart"
          description="Use the search bar above to find fruits by name, like “mango” or “banana”."
        />
      </div>
    );
  }

  const query = productListQuerySchema.parse({
    search: rawQuery,
    page: searchParams.page,
  });

  const { items, pagination } = await listPublicProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        Search results for &ldquo;{rawQuery}&rdquo;
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {pagination.total} {pagination.total === 1 ? 'result' : 'results'}
      </p>

      <div className="mt-6">
        <ProductGrid
          products={items}
          emptyTitle={`No results for "${rawQuery}"`}
          emptyDescription="Try a different spelling or browse by category instead."
        />
      </div>

      <PaginationControls page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
