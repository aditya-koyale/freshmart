import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="mx-auto h-14 w-14 rounded-full" />
      <Skeleton className="mx-auto mt-4 h-7 w-48" />
      <div className="mt-8 flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    </div>
  );
}
