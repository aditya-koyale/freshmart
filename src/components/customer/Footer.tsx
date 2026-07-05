import Link from 'next/link';
import type { CategoryPillData } from '@/components/customer/CategoryPill';

export function Footer({ categories }: { categories: CategoryPillData[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-surface-subtle">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">FreshMart</h2>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">
            Fresh fruits delivered to your door, sourced directly from the
            wholesale market. Powered by Aditya Fruit Supplier.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Shop by category</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
            {categories.length === 0 ? (
              <li>No categories yet</li>
            ) : (
              categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className="hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Shop</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
            <li>
              <Link href="/products" className="hover:text-primary">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-primary">
                All Categories
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-ink-faint">
        © {new Date().getFullYear()} FreshMart — Aditya Fruit Supplier. All rights reserved.
      </div>
    </footer>
  );
}
