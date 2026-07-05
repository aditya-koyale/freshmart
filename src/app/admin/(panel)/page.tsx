import type { Metadata } from 'next';
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { PageHeader } from '@/components/admin/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { getDashboardStats } from '@/services/analyticsService';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Dashboard — FreshMart Admin' };

export const revalidate = 60;

async function getRecentOrders() {
  return db.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { fullName: true } } },
  });
}

const STATUS_BADGES: Record<string, { label: string; variant: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'primary' },
  PREPARING: { label: 'Preparing', variant: 'primary' },
  PACKED: { label: 'Packed', variant: 'neutral' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'accent' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'error' },
  REFUNDED: { label: 'Refunded', variant: 'error' },
};

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ]);

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={now}
      />

      {/* Revenue cards */}
      <section aria-label="Revenue overview">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Revenue
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today" value={formatPrice(stats.revenue.today)} />
          <StatCard label="This Week" value={formatPrice(stats.revenue.thisWeek)} />
          <StatCard label="This Month" value={formatPrice(stats.revenue.thisMonth)} />
        </div>
      </section>

      {/* Order cards */}
      <section aria-label="Order overview">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Orders
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Today" value={String(stats.orders.today)} />
          <StatCard label="This Week" value={String(stats.orders.thisWeek)} />
          <StatCard label="This Month" value={String(stats.orders.thisMonth)} />
          <StatCard
            label="Pending"
            value={String(stats.orders.pending)}
            variant={stats.orders.pending > 0 ? 'warning' : 'default'}
          />
          <StatCard label="Confirmed" value={String(stats.orders.confirmed)} variant="success" />
          <StatCard
            label="Out for Delivery"
            value={String(stats.orders.outForDelivery)}
            variant="success"
          />
        </div>
      </section>

      {/* Catalog & alerts */}
      <section aria-label="Catalog and alerts">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Catalog
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Active Products" value={String(stats.totalProducts)} />
          <StatCard label="Total Customers" value={String(stats.totalCustomers)} />
          <StatCard
            label="Low Stock Variants"
            value={String(stats.lowStockItems)}
            variant={stats.lowStockItems > 0 ? 'warning' : 'default'}
            subtext={stats.lowStockItems > 0 ? 'Needs attention' : 'All good'}
          />
        </div>
      </section>

      {/* Founder Dashboard quick links (SRS Part 12 §3 — same account, extended view) */}
      <section aria-label="Founder quick links">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Founder Dashboard
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: '/admin/analytics', label: 'Full Analytics', icon: '📊' },
            { href: '/admin/orders', label: 'All Orders', icon: '📦' },
            { href: '/admin/customers', label: 'Customers', icon: '👥' },
            { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:shadow-raised hover:border-primary/30 transition-all"
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section aria-label="Recent orders">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Recent Orders
          </h2>
          <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                {['Order #', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-muted">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const statusInfo = STATUS_BADGES[order.status] ?? { label: order.status, variant: 'neutral' as const };
                  return (
                    <tr key={order.id} className="hover:bg-surface-subtle">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{order.user.fullName}</td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {formatPrice(order.grandTotal.toNumber())}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
