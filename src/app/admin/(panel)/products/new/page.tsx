import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductCreateForm } from '@/components/admin/ProductCreateForm';
import { listAdminCategories } from '@/services/categoryService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'New Product — FreshMart Admin' };

export default async function NewProductPage() {
  const categories = await listAdminCategories();

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="New Product" />
        <div className="rounded-card border border-warning/30 bg-warning/5 p-6 text-sm text-ink-muted">
          You need at least one category before creating a product.{' '}
          <Link href="/admin/categories" className="font-medium text-primary hover:underline">
            Create a category first →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New Product"
        description="Fill in the details below. You can upload images after the product is created."
      />
      <ProductCreateForm
        categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
      />
    </div>
  );
}
