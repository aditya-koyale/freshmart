'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
}

/**
 * Reused by every paginated catalog view (product listing, category page,
 * search results). Preserves all existing query params (search, category
 * filter, etc.) and only updates `page`.
 */
export function PaginationControls({ page, totalPages }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-3"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        aria-label="Previous page"
      >
        Previous
      </Button>
      <span className="text-sm text-ink-muted">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  );
}
