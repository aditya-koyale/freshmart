import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SalesTrendChart } from '@/components/admin/SalesTrendChart';
import { getDashboardStats, getSalesTrend } from '@/services/analyticsService';
import { db } from '@/lib/db';
import { formatPrice } from '@/utils/format';

export const metadata: Metadata = { title: 'Analytics — FreshMart Admin' };
export const revalidate = 300;

async function getTopProducts(limit = 10) {
  const items = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
    where: { order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
  });
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
  return items.map((item) => ({
    productId: item.productId,
    name: nameMap[item.productId] ?? 'Unknown',
    totalRevenue: item._sum.total?.toNumber() ?? 0,
    totalQty: item._sum.quantity ?? 0,
    orderCount: item._count.id,
  }));
}

async function getOrderStatusBreakdown() {
  const groups = await db.order.groupBy({ by: ['status'], _count: { id: true } });
  return Object.fromEntries(groups.map((g) => [g.status, g._count.id]));
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};
const STATUS_VARIANTS: Record<string, 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'> = {
  PENDING: 'warning', CONFIRMED: 'primary', PREPARING: 'primary', PACKED: 'neutral',
  OUT_FOR_DELIVERY: 'accent', DELIVERED: 'success', CANCELLED: 'error', REFUNDED: 'error',
};

export default async function AnalyticsPage() {
  const [stats, trend, topProducts, statusBreakdown] = await Promise.all([
    getDashboardStats(),
    getSalesTrend(30),
    getTopProducts(),
    getOrderStatusBreakdown(),
  ]);

  const totalOrders = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics & Reports" description="30-day performance overview." />

      {/* Revenue KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Revenue</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today" value={formatPrice(stats.revenue.today)} />
          <StatCard label="This Week" value={formatPrice(stats.revenue.thisWeek)} />
          <StatCard label="This Month" value={formatPrice(stats.revenue.thisMonth)} />
        </div>
      </section>

      {/* 30-day sales trend */}
      <Card padding="md">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Revenue — Last 30 Days</h2>
        <SalesTrendChart data={trend} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Card padding="md">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-muted">No completed orders yet.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-faint">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">{p.totalQty} units · {p.orderCount} orders</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">{formatPrice(p.totalRevenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Order status breakdown */}
        <Card padding="md">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Orders by Status</h2>
          {totalOrders === 0 ? (
            <p className="text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {Object.entries(statusBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const pct = Math.round((count / totalOrders) * 100);
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
                          {STATUS_LABELS[status] ?? status}
                        </Badge>
                        <span className="text-ink-muted">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-border">
                        <div
                          className="h-1.5 rounded-full bg-primary/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>
      </div>

      {/* Catalog stats */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Catalog</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Active Products" value={String(stats.totalProducts)} />
          <StatCard label="Registered Customers" value={String(stats.totalCustomers)} />
          <StatCard label="Low-Stock Variants" value={String(stats.lowStockItems)} variant={stats.lowStockItems > 0 ? 'warning' : 'default'} subtext={stats.lowStockItems > 0 ? 'Needs attention' : 'All good'} />
        </div>
      </section>
    </div>
  );
}
