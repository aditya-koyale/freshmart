import { ProductCard, type ProductCardData } from '@/components/customer/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ProductGridProps {
  products: ProductCardData[];
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Reused by the homepage sections, category page, product listing page,
 * and search page — the grid layout and empty state are defined exactly
 * once here.
 */
export function ProductGrid({
  products,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or check back soon.',
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
