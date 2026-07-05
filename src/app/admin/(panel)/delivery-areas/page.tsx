import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { DeliveryAreaManager } from '@/components/admin/DeliveryAreaManager';
export const metadata: Metadata = { title: 'Delivery Areas — FreshMart Admin' };
export default async function DeliveryAreasPage() {
  const areas = await db.deliveryArea.findMany({ orderBy: { areaName: 'asc' } });
  return <DeliveryAreaManager areas={areas.map((a) => ({
    id: a.id, pinCode: a.pinCode, areaName: a.areaName,
    deliveryCharge: a.deliveryCharge.toNumber(),
    freeDeliveryAbove: a.freeDeliveryAbove?.toNumber() ?? null,
    minOrderValue: a.minOrderValue.toNumber(),
    estimatedMinutes: a.estimatedMinutes, isActive: a.isActive,
  }))} />;
}
