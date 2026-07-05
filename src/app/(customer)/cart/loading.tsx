import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-7 w-32" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </div>
  );
}
