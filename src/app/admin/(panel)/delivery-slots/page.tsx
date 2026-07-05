import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { DeliverySlotManager } from '@/components/admin/DeliverySlotManager';
export const metadata: Metadata = { title: 'Delivery Slots — FreshMart Admin' };
export default async function DeliverySlotsPage() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slots = await db.deliverySlot.findMany({
    where: { date: { gte: from } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return <DeliverySlotManager slots={slots.map((s) => ({
    id: s.id, date: s.date.toISOString(),
    startTime: s.startTime, endTime: s.endTime,
    maxOrders: s.maxOrders, currentLoad: s.currentLoad, isDisabled: s.isDisabled,
  }))} />;
}
