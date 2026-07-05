import clsx from 'clsx';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Column<T> {
  key: string;
  heading: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Generic admin table — columns are defined at the call site, which
 * keeps this component free of domain knowledge. Used across every
 * admin management section (Products, Orders, Coupons, etc.) with
 * horizontally scrollable overflow on mobile and fixed-layout on desktop.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'No items found',
  emptyDescription,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-subtle">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted',
                  col.className,
                )}
              >
                {col.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-surface-subtle">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx('px-4 py-3 align-middle text-ink', col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
