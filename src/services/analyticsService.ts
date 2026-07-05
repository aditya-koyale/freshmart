import { db } from '@/lib/db';

export interface RevenueStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface OrderStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  confirmed: number;
  outForDelivery: number;
}

export interface DashboardStats {
  revenue: RevenueStats;
  orders: OrderStats;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
}

function startOf(period: 'day' | 'week' | 'month'): Date {
  const now = new Date();
  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function totalRevenue(from: Date): Promise<number> {
  const result = await db.order.aggregate({
    where: {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      createdAt: { gte: from },
    },
    _sum: { grandTotal: true },
  });
  return result._sum.grandTotal?.toNumber() ?? 0;
}

async function orderCount(from: Date): Promise<number> {
  return db.order.count({ where: { createdAt: { gte: from } } });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    revenueToday,
    revenueWeek,
    revenueMonth,
    ordersToday,
    ordersWeek,
    ordersMonth,
    pendingOrders,
    confirmedOrders,
    outForDeliveryOrders,
    totalProducts,
    totalCustomers,
  ] = await Promise.all([
    totalRevenue(startOf('day')),
    totalRevenue(startOf('week')),
    totalRevenue(startOf('month')),
    orderCount(startOf('day')),
    orderCount(startOf('week')),
    orderCount(startOf('month')),
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: 'CONFIRMED' } }),
    db.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
    db.product.count({ where: { deletedAt: null, isActive: true } }),
    db.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
  ]);

  // Low-stock: items where available stock ≤ their own threshold. Prisma
  // can't compare two columns in one row without a raw query, so we fetch
  // all inventories and filter in JS. Volume here is small (product
  // catalog) so this is not a performance concern.
  const allInventories = await db.inventory.findMany({
    where: { stock: { gt: 0 } },
    select: { stock: true, reservedStock: true, lowStockThreshold: true },
  });
  const lowStockCount = allInventories.filter(
    (inv) => inv.stock - inv.reservedStock <= inv.lowStockThreshold,
  ).length;

  return {
    revenue: { today: revenueToday, thisWeek: revenueWeek, thisMonth: revenueMonth },
    orders: {
      today: ordersToday,
      thisWeek: ordersWeek,
      thisMonth: ordersMonth,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      outForDelivery: outForDeliveryOrders,
    },
    totalProducts,
    totalCustomers,
    lowStockItems: lowStockCount,
  };
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Returns the last `days` days of daily revenue and order counts for
 * the dashboard sparkline charts.
 */
export async function getSalesTrend(days = 14): Promise<SalesTrendPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      createdAt: { gte: since },
    },
    select: { createdAt: true, grandTotal: true },
  });

  const buckets: Record<string, { revenue: number; orders: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].revenue += order.grandTotal.toNumber();
      buckets[key].orders += 1;
    }
  }

  return Object.entries(buckets).map(([date, data]) => ({ date, ...data }));
}
