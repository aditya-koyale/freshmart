'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function AdminSearchInput({ placeholder = 'Search…' }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  // Keep input in sync when navigating back/forward
  useEffect(() => {
    setValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="submit"
        className="flex h-9 items-center rounded-control bg-primary px-3 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
}
