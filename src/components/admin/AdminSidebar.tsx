'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Catalog',
    items: [
      {
        label: 'Products',
        href: '/admin/products',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: 'Categories',
        href: '/admin/categories',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Banners',
        href: '/admin/banners',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Sales',
    items: [
      {
        label: 'Orders',
        href: '/admin/orders',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Coupons',
        href: '/admin/coupons',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Delivery',
    items: [
      {
        label: 'Delivery Areas',
        href: '/admin/delivery-areas',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
      {
        label: 'Delivery Slots',
        href: '/admin/delivery-slots',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Analytics',
    items: [
      {
        label: 'Reports',
        href: '/admin/analytics',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'System',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg font-bold text-primary">FreshMart</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {group.heading}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-ink-muted hover:bg-surface-subtle hover:text-ink',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-subtle hover:text-error"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile toggle button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface shadow-soft lg:hidden"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-raised lg:hidden">
            <button
              type="button"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-control hover:bg-surface-subtle"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
