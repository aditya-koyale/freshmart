import { Header } from '@/components/customer/Header';
import { Footer } from '@/components/customer/Footer';
import { listPublicCategories } from '@/services/categoryService';

/**
 * Shared shell for every customer-facing page. Categories are fetched
 * once here (server component) and passed down to both the Header's
 * category menu and the Footer's quick links, rather than each
 * component fetching independently.
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await listPublicCategories();
  const categoryPills = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    iconUrl: category.iconUrl,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categoryPills} />
      <main className="flex-1">{children}</main>
      <Footer categories={categoryPills} />
    </div>
  );
}
