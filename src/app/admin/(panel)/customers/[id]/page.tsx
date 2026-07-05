import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { PageHeader } from '@/components/admin/PageHeader';
import { db } from '@/lib/db';
import { formatPrice } from '@/utils/format';

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

export const metadata: Metadata = { title: 'Customer — FreshMart Admin' };

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await db.user.findFirst({
    where: { id: params.id, role: 'CUSTOMER' },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true } } },
      },
      addresses: { orderBy: { isDefault: 'desc' } },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.orders
    .filter((o) => !['CANCELLED', 'REFUNDED'].includes(o.status))
    .reduce((sum, o) => sum + o.grandTotal.toNumber(), 0);

  interface OrderRow {
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
    itemCount: number;
    createdAt: Date;
  }

  const orderRows: OrderRow[] = customer.orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    grandTotal: o.grandTotal.toNumber(),
    itemCount: o.items.length,
    createdAt: o.createdAt,
  }));

  const orderColumns: Column<OrderRow>[] = [
    {
      key: 'order',
      heading: 'Order',
      render: (row) => (
        <Link href={`/admin/orders/${row.id}`} className="font-medium text-primary hover:underline">
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: 'items',
      heading: 'Items',
      className: 'w-16 text-center',
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
      key: 'date',
      heading: 'Date',
      className: 'w-32',
      render: (row) => (
        <span className="text-sm text-ink-muted">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.fullName}
        description={
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/admin/customers" className="hover:text-primary">
              Customers
            </Link>
            <span>/</span>
            <span>{customer.fullName}</span>
          </span>
        }
        action={
          <Badge variant={customer.isActive ? 'success' : 'neutral'}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order history */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Order History ({customer.orders.length})
            </h2>
            <DataTable
              columns={orderColumns}
              rows={orderRows}
              rowKey={(row) => row.id}
              emptyTitle="No orders yet"
            />
          </Card>

          {/* Saved addresses */}
          {customer.addresses.length > 0 && (
            <Card padding="md">
              <h2 className="mb-4 font-display text-sm font-semibold text-ink">
                Saved Addresses
              </h2>
              <ul className="flex flex-col gap-3">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="rounded-control border border-border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{address.label}</span>
                      {address.isDefault && (
                        <Badge variant="primary">Default</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-ink-muted">
                      {address.houseNumber}{address.buildingName ? `, ${address.buildingName}` : ''},{' '}
                      {address.street}, {address.area}, {address.city} — {address.pinCode}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Customer details */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Details
            </h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">Email</dt>
                <dd className="text-ink">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Mobile</dt>
                <dd className="text-ink">{customer.mobileNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Joined</dt>
                <dd className="text-ink">
                  {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </dd>
              </div>
              {customer.lastLoginAt && (
                <div>
                  <dt className="text-xs text-ink-faint">Last Login</dt>
                  <dd className="text-ink">
                    {new Date(customer.lastLoginAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Stats */}
          <Card padding="md">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink">
              Summary
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">Total Orders</dt>
                <dd className="text-xl font-bold text-ink">{customer.orders.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Total Spent</dt>
                <dd className="text-xl font-bold text-ink">{formatPrice(totalSpent)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
