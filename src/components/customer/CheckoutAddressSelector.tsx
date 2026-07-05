'use client';

import Link from 'next/link';
import clsx from 'clsx';

export interface CheckoutAddressOption {
  id: string;
  label: string;
  houseNumber: string;
  buildingName: string | null;
  street: string;
  area: string;
  city: string;
  pinCode: string;
  isDefault: boolean;
}

export function CheckoutAddressSelector({
  addresses,
  selectedId,
  onSelect,
}: {
  addresses: CheckoutAddressOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Deliver to</legend>
      <div className="mt-3 flex flex-col gap-2">
        {addresses.map((address) => {
          const isSelected = address.id === selectedId;
          return (
            <label
              key={address.id}
              className={clsx(
                'flex cursor-pointer items-start gap-3 rounded-control border p-3.5 text-sm transition-colors',
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-subtle',
              )}
            >
              <input
                type="radio"
                name="checkout-address"
                checked={isSelected}
                onChange={() => onSelect(address.id)}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary/40"
              />
              <span>
                <span className="flex items-center gap-2 font-medium text-ink">
                  {address.label}
                  {address.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Default
                    </span>
                  )}
                </span>
                <span className="block text-ink-muted">
                  {address.houseNumber}
                  {address.buildingName ? `, ${address.buildingName}` : ''}, {address.street},{' '}
                  {address.area}, {address.city} — {address.pinCode}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <Link
        href="/addresses/new"
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        + Add a new address
      </Link>
    </fieldset>
  );
}
