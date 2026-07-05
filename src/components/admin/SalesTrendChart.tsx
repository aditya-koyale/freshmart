'use client';

import { formatPrice } from '@/utils/format';

interface TrendPoint { date: string; revenue: number; orders: number }

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return <p className="text-sm text-ink-muted">No data yet.</p>;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const width = 100 / data.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Bar chart */}
      <div className="flex h-40 items-end gap-0.5">
        {data.map((point) => {
          const pct = (point.revenue / maxRevenue) * 100;
          const label = new Date(point.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${label}: ${formatPrice(point.revenue)} · ${point.orders} order${point.orders !== 1 ? 's' : ''}`}
            >
              <div
                className="w-full rounded-t-sm bg-primary/70 transition-all group-hover:bg-primary"
                style={{ height: `${Math.max(pct, 1)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every ~4th label to avoid crowding */}
      <div className="flex">
        {data.map((point, i) => (
          <div key={point.date} className="flex-1 text-center">
            {i % 4 === 0 && (
              <span className="text-[10px] text-ink-faint">
                {new Date(point.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="flex justify-between border-t border-border pt-2 text-xs text-ink-muted">
        <span>Total revenue: <strong className="text-ink">{formatPrice(data.reduce((s, d) => s + d.revenue, 0))}</strong></span>
        <span>Total orders: <strong className="text-ink">{data.reduce((s, d) => s + d.orders, 0)}</strong></span>
      </div>
    </div>
  );
}
