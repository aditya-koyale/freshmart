import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { PageHeader } from '@/components/admin/PageHeader';
import { db } from '@/lib/db';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Customers — FreshMart Admin' };

type Props = { searchParams: { search?: string; page?: string } };

export default async function AdminCustomersPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const PAGE_SIZE = 25;

  const where = searchParams.search
    ? {
        role: 'CUSTOMER' as const,
        OR: [
          { fullName: { contains: searchParams.search, mode: 'insensitive' as const } },
          { email: { contains: searchParams.search, mode: 'insensitive' as const } },
        ],
      }
    : { role: 'CUSTOMER' as const };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, mobileNumber: true,
        isActive: true, createdAt: true, lastLoginAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  interface CustomerRow {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
    _count: { orders: number };
  }

  const columns: Column<CustomerRow>[] = [
    {
      key: 'name',
      heading: 'Customer',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.id}`} className="font-medium text-ink hover:text-primary">
            {row.fullName}
          </Link>
          <p className="text-xs text-ink-faint">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'mobile',
      heading: 'Mobile',
      className: 'w-36',
      render: (row) => <span className="text-ink-muted">{row.mobileNumber}</span>,
    },
    {
      key: 'orders',
      heading: 'Orders',
      className: 'w-20 text-center',
      render: (row) => <span className="font-medium text-ink">{row._count.orders}</span>,
    },
    {
      key: 'status',
      heading: 'Status',
      className: 'w-24',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'joined',
      heading: 'Joined',
      className: 'w-28',
      render: (row) => (
        <span className="text-sm text-ink-muted">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      heading: '',
      className: 'w-20 text-right',
      render: (row) => (
        <Link href={`/admin/customers/${row.id}`} className="text-xs font-medium text-primary hover:underline">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Customers" description={`${total} registered customers`} />
      <div className="w-64">
        <Suspense fallback={null}>
          <AdminSearchInput placeholder="Name or email…" />
        </Suspense>
      </div>
      <DataTable
        columns={columns}
        rows={customers as CustomerRow[]}
        rowKey={(row) => row.id}
        emptyTitle="No customers found"
        emptyDescription="Customers will appear here once they register."
      />
      <AdminPagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} />
    </div>
  );
}
