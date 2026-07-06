import type { Metadata } from 'next';
import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { listAdminCategories } from '@/services/categoryService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Categories — FreshMart Admin' };

export default async function CategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <CategoriesManager
      categories={categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconUrl: cat.iconUrl,
        displayOrder: cat.displayOrder,
        isHidden: cat.isHidden,
      }))}
    />
  );
}
