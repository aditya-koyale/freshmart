import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { CategoryPill } from '@/components/customer/CategoryPill';
import { BannerCarousel } from '@/components/customer/BannerCarousel';
import { listPublicCategories } from '@/services/categoryService';
import { listPublicProducts } from '@/services/productService';
import { listPublicBanners } from '@/services/bannerService';
import { productListQuerySchema } from '@/lib/validation/product';

export const revalidate = 60;

async function getSection(flag: 'featured' | 'bestSeller' | 'seasonal' | 'newArrival') {
  const query = productListQuerySchema.parse({ [flag]: true, pageSize: 8 });
  const result = await listPublicProducts(query);
  return result.items;
}

export default async function HomePage() {
  const [banners, categories, featured, bestSellers, seasonal] = await Promise.all([
    listPublicBanners(),
    listPublicCategories(),
    getSection('featured'),
    getSection('bestSeller'),
    getSection('seasonal'),
  ]);

  return (
    <div className="flex flex-col gap-14 pb-16">
      {/* Hero: real banners when configured, static fallback when not */}
      {banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <section className="bg-primary/5">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 sm:px-6">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Straight from the wholesale market
            </span>
            <h1 className="max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
              Fresh fruit, picked and delivered the same day.
            </h1>
            <p className="max-w-md text-ink-muted">
              FreshMart sources directly from Aditya Fruit Supplier so what
              lands on your doorstep is as close to the market as it gets.
            </p>
            <Button href="/products" size="lg">
              Shop All Products
            </Button>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionHeading title="Shop by Category" href="/categories" />
          <div className="mt-5 flex gap-6 overflow-x-auto pb-2">
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
        </section>
      )}

      <ProductSection title="Featured" href="/products?featured=true" products={featured} />
      <ProductSection
        title="Best Sellers"
        href="/products?bestSeller=true"
        products={bestSellers}
      />
      <ProductSection title="In Season Now" href="/products?seasonal=true" products={seasonal} />
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <Link href={href} className="text-sm font-medium text-primary hover:underline">
        View all
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: Parameters<typeof ProductGrid>[0]['products'];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <SectionHeading title={title} href={href} />
      <div className="mt-5">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
