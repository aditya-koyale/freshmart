import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ImageGallery } from '@/components/customer/ImageGallery';
import { ProductVariantPanel } from '@/components/customer/ProductVariantPanel';
import { WishlistButton } from '@/components/customer/WishlistButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Card } from '@/components/ui/Card';
import { getPublicProductBySlug } from '@/services/productService';
import { NotFoundError } from '@/lib/api-response';

interface ProductDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  try {
    const product = await getPublicProductBySlug(params.slug);
    return {
      title: product.name,
      description: product.shortDescription ?? `Buy fresh ${product.name} on FreshMart.`,
    };
  } catch {
    return { title: 'Product' };
  }
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product;
  try {
    product = await getPublicProductBySlug(params.slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/products' },
          { label: product.category.name, href: `/category/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            {product.isBestSeller && <Badge variant="accent">Best Seller</Badge>}
            {product.isSeasonal && <Badge variant="primary">Seasonal</Badge>}
            {product.isNewArrival && <Badge variant="neutral">New Arrival</Badge>}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              {product.name}
            </h1>
            <WishlistButton productId={product.id} />
          </div>

          {averageRating !== null && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} showValue />
              <span className="text-sm text-ink-muted">
                ({product.reviews.length} review{product.reviews.length === 1 ? '' : 's'})
              </span>
            </div>
          )}

          {product.shortDescription && (
            <p className="text-ink-muted">{product.shortDescription}</p>
          )}

          <ProductVariantPanel variants={product.weightVariants} />

          <dl className="grid grid-cols-1 gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
            {product.origin && (
              <Detail label="Origin" value={product.origin} />
            )}
            {product.freshnessInfo && (
              <Detail label="Freshness" value={product.freshnessInfo} />
            )}
            {product.storageInfo && (
              <Detail label="Storage Tips" value={product.storageInfo} />
            )}
          </dl>
        </div>
      </div>

      {product.description && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-lg font-bold text-ink">About this product</h2>
          <p className="mt-3 whitespace-pre-line text-ink-muted">{product.description}</p>
        </section>
      )}

      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-lg font-bold text-ink">
          Customer Reviews {product.reviews.length > 0 && `(${product.reviews.length})`}
        </h2>

        {product.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            No reviews yet. Be the first to share your experience after your order arrives.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {product.reviews.map((review) => (
              <li key={review.id}>
                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      {review.user.fullName}
                    </span>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-ink-muted">{review.comment}</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-ink">{label}</dt>
      <dd className="text-ink-muted">{value}</dd>
    </div>
  );
}
