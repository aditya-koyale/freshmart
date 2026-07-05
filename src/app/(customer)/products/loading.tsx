import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-24" />
      <div className="mt-6">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
