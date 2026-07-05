'use client';

import { useSession } from 'next-auth/react';

export function AdminHeader({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="hidden sm:inline">
          {session?.user?.name ?? session?.user?.email ?? 'Admin'}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {(session?.user?.name ?? 'A').charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
