import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or may have been moved."
        action={<Button href="/">Back to Home</Button>}
      />
    </div>
  );
}
