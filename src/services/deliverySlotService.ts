import { db } from '@/lib/db';

export interface AvailableDeliverySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

/**
 * Returns open delivery slots for the next `daysAhead` days. Filters out
 * full slots (currentLoad >= maxOrders) in application code since Prisma
 * can't compare two columns of the same row directly in a `where`
 * clause without a raw query, and the slot volume here is small enough
 * that this is not a performance concern.
 *
 * No admin UI exists yet (Phase 4) to create DeliverySlot rows, so this
 * legitimately returns an empty array on a fresh install — Checkout
 * treats "no slots configured" as "slot selection not required yet"
 * rather than blocking every order on a feature that isn't set up.
 */
export async function listUpcomingDeliverySlots(
  daysAhead = 7,
): Promise<AvailableDeliverySlot[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(startOfToday.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const slots = await db.deliverySlot.findMany({
    where: {
      isDisabled: false,
      date: { gte: startOfToday, lte: endDate },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return slots
    .filter((slot) => slot.currentLoad < slot.maxOrders)
    .map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
}
