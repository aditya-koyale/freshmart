import clsx from 'clsx';

type Trend = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: Trend;
  trendLabel?: string;
  variant?: 'default' | 'warning' | 'success';
}

const TREND_COLORS: Record<Trend, string> = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-ink-muted',
};

/**
 * Dashboard metric tile — label, primary value, optional sub-context,
 * optional trend indicator. Kept dumb (pure display) so the dashboard
 * page owns the data-fetching and these are just renderers.
 */
export function StatCard({
  label,
  value,
  subtext,
  trend,
  trendLabel,
  variant = 'default',
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-card border bg-surface p-5 shadow-soft',
        variant === 'warning' && 'border-warning/30 bg-warning/5',
        variant === 'success' && 'border-success/30 bg-success/5',
        variant === 'default' && 'border-border',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>

      {(subtext ?? trendLabel) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && trendLabel && (
            <span className={clsx('text-xs font-medium', TREND_COLORS[trend])}>
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendLabel}
            </span>
          )}
          {subtext && <span className="text-xs text-ink-faint">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
