import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { PageHeader } from '@/components/admin/PageHeader';
import { OrderStatusFilter } from '@/components/admin/OrderStatusFilter';
import { listAdminOrders } from '@/services/adminOrderService';
import { formatPrice } from '@/utils/format';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Orders — FreshMart Admin' };

const STATUS_BADGES: Record<string, { label: string; variant: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  PENDING:          { label: 'Pending', variant: 'warning' },
  CONFIRMED:        { label: 'Confirmed', variant: 'primary' },
  PREPARING:        { label: 'Preparing', variant: 'primary' },
  PACKED:           { label: 'Packed', variant: 'neutral' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'accent' },
  DELIVERED:        { label: 'Delivered', variant: 'success' },
  CANCELLED:        { label: 'Cancelled', variant: 'error' },
  REFUNDED:         { label: 'Refunded', variant: 'error' },
};

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

type Props = {
  searchParams: { search?: string; status?: string; page?: string };
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const { orders, pagination } = await listAdminOrders({
    page,
    pageSize: 25,
    search: searchParams.search,
    status: searchParams.status as Parameters<typeof listAdminOrders>[0]['status'],
  });

  const columns: Column<OrderRow>[] = [
    {
      key: 'order',
      heading: 'Order',
      render: (row) => (
        <div>
          <Link
            href={`/admin/orders/${row.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
          <p className="text-xs text-ink-faint">
            {new Date(row.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      heading: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.customerName}</p>
          <p className="text-xs text-ink-faint">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items',
      heading: 'Items',
      className: 'w-20 text-center',
      render: (row) => <span className="text-ink-muted">{row.itemCount}</span>,
    },
    {
      key: 'total',
      heading: 'Total',
      className: 'w-28',
      render: (row) => (
        <span className="font-medium text-ink">{formatPrice(row.grandTotal)}</span>
      ),
    },
    {
      key: 'status',
      heading: 'Status',
      className: 'w-40',
      render: (row) => {
        const info = STATUS_BADGES[row.status] ?? { label: row.status, variant: 'neutral' as const };
        return <Badge variant={info.variant}>{info.label}</Badge>;
      },
    },
    {
      key: 'actions',
      heading: '',
      className: 'w-20 text-right',
      render: (row) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Orders"
        description={`${pagination.total} total orders`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <AdminSearchInput placeholder="Order #, customer name or email…" />
        </div>
        <Suspense fallback={null}>
          <OrderStatusFilter />
        </Suspense>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(row) => row.id}
        emptyTitle="No orders found"
        emptyDescription="Orders placed by customers will appear here."
      />

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
