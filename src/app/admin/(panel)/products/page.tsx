import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductStatusToggle, ProductDeleteButton } from '@/components/admin/ProductListActions';
import { listAdminProducts } from '@/services/productService';
import { productListQuerySchema } from '@/lib/validation/product';
import { formatPrice } from '@/utils/format';

export const metadata: Metadata = { title: 'Products — FreshMart Admin' };

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  imageUrl: string | null;
  variantCount: number;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isActive: boolean;
}

type Props = { searchParams: { search?: string; category?: string; page?: string } };

export default async function AdminProductsPage({ searchParams }: Props) {
  const query = productListQuerySchema.parse({
    search: searchParams.search,
    categorySlug: searchParams.category,
    page: searchParams.page,
    pageSize: 20,
  });

  const { items, pagination } = await listAdminProducts(query);

  const rows: ProductRow[] = items.map((product) => {
    const prices = product.weightVariants.map((v) => Number(v.price));
    const stock = product.weightVariants.reduce(
      (sum, v) =>
        sum +
        Math.max(0, (v.inventory?.stock ?? 0) - (v.inventory?.reservedStock ?? 0)),
      0,
    );
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryName: product.category.name,
      imageUrl: product.images[0]?.url ?? null,
      variantCount: product.weightVariants.length,
      minPrice: Math.min(...prices, Infinity),
      maxPrice: Math.max(...prices, 0),
      totalStock: stock,
      isActive: product.isActive,
    };
  });

  const columns: Column<ProductRow>[] = [
    {
      key: 'product',
      heading: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-control bg-surface-subtle">
            {row.imageUrl && (
              <Image src={row.imageUrl} alt="" fill sizes="40px" className="object-cover" />
            )}
          </div>
          <div>
            <Link
              href={`/admin/products/${row.id}`}
              className="font-medium text-ink hover:text-primary"
            >
              {row.name}
            </Link>
            <p className="text-xs text-ink-faint">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      heading: 'Category',
      className: 'w-32',
      render: (row) => <span className="text-ink-muted">{row.categoryName}</span>,
    },
    {
      key: 'price',
      heading: 'Price',
      className: 'w-36',
      render: (row) => (
        <div className="text-sm">
          <span className="font-medium text-ink">
            {row.variantCount === 0
              ? '—'
              : row.minPrice === row.maxPrice
              ? formatPrice(row.minPrice)
              : `${formatPrice(row.minPrice)} – ${formatPrice(row.maxPrice)}`}
          </span>
          <p className="text-xs text-ink-faint">
            {row.variantCount} variant{row.variantCount !== 1 ? 's' : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      heading: 'Stock',
      className: 'w-24',
      render: (row) => (
        <Badge
          variant={
            row.totalStock === 0
              ? 'error'
              : row.totalStock <= 10
              ? 'warning'
              : 'success'
          }
        >
          {row.totalStock}
        </Badge>
      ),
    },
    {
      key: 'status',
      heading: 'Active',
      className: 'w-20',
      render: (row) => (
        <ProductStatusToggle productId={row.id} isActive={row.isActive} />
      ),
    },
    {
      key: 'actions',
      heading: '',
      className: 'w-28 text-right',
      render: (row) => (
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/products/${row.id}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit
          </Link>
          <ProductDeleteButton productId={row.id} productName={row.name} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        description={`${pagination.total} total products`}
        action={
          <Button href="/admin/products/new" size="sm">
            + New Product
          </Button>
        }
      />

      <div className="w-full max-w-sm">
        <AdminSearchInput placeholder="Search products…" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyTitle="No products yet"
        emptyDescription="Create your first product to start selling."
      />

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
