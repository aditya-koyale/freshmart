import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

/**
 * Shared shell for login/register/forgot-password/reset-password so they
 * all look like one consistent flow rather than four separately designed
 * pages.
 */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Card padding="lg">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}
