'use client';

import clsx from 'clsx';
import type { AvailableDeliverySlot } from '@/services/deliverySlotService';

function formatSlotDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Renders nothing when no slots are configured — there's no admin UI yet
 * (Phase 4) to create DeliverySlot rows, so on a fresh install this is
 * legitimately empty. Slot selection becomes available the moment an
 * admin configures slots, with no code change required here, mirroring
 * the same "advisory until configured" pattern used for Google Maps
 * autocomplete and delivery-area serviceability.
 */
export function DeliverySlotSelector({
  slots,
  selectedId,
  onSelect,
}: {
  slots: AvailableDeliverySlot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (slots.length === 0) return null;

  const grouped = slots.reduce<Record<string, AvailableDeliverySlot[]>>((acc, slot) => {
    const key = formatSlotDate(slot.date);
    acc[key] = acc[key] ? [...acc[key], slot] : [slot];
    return acc;
  }, {});

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Delivery slot</legend>
      <div className="mt-3 flex flex-col gap-3">
        {Object.entries(grouped).map(([dateLabel, daySlots]) => (
          <div key={dateLabel}>
            <p className="text-xs font-medium text-ink-muted">{dateLabel}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const isSelected = slot.id === selectedId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelect(slot.id)}
                    aria-pressed={isSelected}
                    className={clsx(
                      'rounded-control border px-3 py-2 text-sm font-medium transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-ink hover:bg-surface-subtle',
                    )}
                  >
                    {slot.startTime} – {slot.endTime}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
