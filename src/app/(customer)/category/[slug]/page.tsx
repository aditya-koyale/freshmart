import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { PaginationControls } from '@/components/customer/PaginationControls';
import { getCategoryBySlug } from '@/services/categoryService';
import { listPublicProducts } from '@/services/productService';
import { productListQuerySchema } from '@/lib/validation/product';
import { NotFoundError } from '@/lib/api-response';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const category = await getCategoryBySlug(params.slug);
    return {
      title: category.name,
      description: `Shop fresh ${category.name.toLowerCase()} on FreshMart.`,
    };
  } catch {
    return { title: 'Category' };
  }
}

export const revalidate = 60;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  let category;
  try {
    category = await getCategoryBySlug(params.slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const query = productListQuerySchema.parse({
    categorySlug: params.slug,
    page: searchParams.page,
  });

  const { items, pagination } = await listPublicProducts(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">{category.name}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
      </p>

      <div className="mt-6">
        <ProductGrid
          products={items}
          emptyTitle="No products in this category yet"
          emptyDescription="Check back soon — new stock is added regularly."
        />
      </div>

      <PaginationControls page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
