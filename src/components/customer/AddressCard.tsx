'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

export interface AddressCardData {
  id: string;
  label: string;
  fullName: string;
  mobileNumber: string;
  houseNumber: string;
  buildingName: string | null;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export function AddressCard({ address }: { address: AddressCardData }) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetDefault() {
    setError(null);
    setIsWorking(true);
    try {
      await apiRequest(`/api/addresses/${address.id}/default`, { method: 'PATCH' });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete the "${address.label}" address?`);
    if (!confirmed) return;

    setError(null);
    setIsWorking(true);
    try {
      await apiRequest(`/api/addresses/${address.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong.');
      setIsWorking(false);
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-ink">{address.label}</h3>
          {address.isDefault && <Badge variant="primary">Default</Badge>}
        </div>
      </div>

      <div className="mt-2 text-sm text-ink-muted">
        <p className="font-medium text-ink">{address.fullName}</p>
        <p>{address.mobileNumber}</p>
        <p>
          {address.houseNumber}
          {address.buildingName ? `, ${address.buildingName}` : ''}, {address.street}
        </p>
        {address.landmark && <p>Near {address.landmark}</p>}
        <p>
          {address.area}, {address.city}, {address.state} — {address.pinCode}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={`/addresses/${address.id}/edit`} variant="outline" size="sm">
          Edit
        </Button>
        {!address.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSetDefault}
            disabled={isWorking}
          >
            Set as Default
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isWorking}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
