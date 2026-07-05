import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Used for empty search results, empty category pages, empty cart, etc.
 * Per design guidance: an empty screen is an invitation to act, so this
 * always has room for a follow-up action rather than just a dead end.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
