'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export function OrderInternalNote({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { internalNote: note.trim() },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Note saved.</Alert>}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Add an internal note visible only to admins…"
        className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
        maxLength={500}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="outline" isLoading={isSaving}>
          Save Note
        </Button>
      </div>
    </form>
  );
}
