'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/customer/SearchBar';
import { LogoutButton } from '@/components/customer/LogoutButton';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import type { CategoryPillData } from '@/components/customer/CategoryPill';

export function Header({ categories }: { categories: CategoryPillData[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold text-primary">
          FreshMart
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-ink md:flex"
        >
          <Link href="/products" className="hover:text-primary">
            Shop All
          </Link>
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 hover:text-primary"
              aria-haspopup="true"
            >
              Categories
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full z-10 w-56 rounded-card border border-border bg-surface p-2 shadow-raised opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-ink-muted">No categories yet</p>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="block rounded-control px-3 py-2 text-sm hover:bg-surface-subtle"
                  >
                    {category.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
          <SearchBar />
          <CartIcon />
          <AccountMenu />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartIcon />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-control"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {isMenuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <SearchBar />
          <nav aria-label="Primary mobile" className="mt-4 flex flex-col gap-3 text-sm font-medium">
            <Link href="/products" onClick={() => setIsMenuOpen(false)}>
              Shop All
            </Link>
            <Link href="/categories" onClick={() => setIsMenuOpen(false)}>
              Categories
            </Link>
          </nav>
          <div className="mt-4 border-t border-border pt-4">
            <AccountMenu onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-control text-ink hover:bg-surface-subtle"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 4h2l2.4 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.4" fill="currentColor" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-9 w-20" aria-hidden="true" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="text-sm font-medium text-ink hover:text-primary"
        >
          Hi, {session.user.name?.split(' ')[0] ?? 'there'}
        </Link>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button href="/login" variant="ghost" size="sm" onClick={onNavigate}>
        Log In
      </Button>
      <Button href="/register" variant="primary" size="sm" onClick={onNavigate}>
        Sign Up
      </Button>
    </div>
  );
}
