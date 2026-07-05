import { db } from '@/lib/db';

export interface ServiceabilityResult {
  isServiceable: boolean;
  areaName?: string;
  deliveryCharge?: number;
  freeDeliveryAbove?: number | null;
  minOrderValue?: number;
  estimatedMinutes?: number;
}

/**
 * Looks up whether FreshMart currently delivers to a given PIN code.
 * Used here (Address Management, as a non-blocking heads-up to the
 * customer) and again later in Checkout (where it becomes a hard
 * requirement before an order can be placed). No DeliveryArea rows exist
 * until an admin configures them (Phase 4), so "not serviceable" is the
 * expected, correct answer on a fresh install — not a bug.
 */
export async function checkPinCodeServiceability(
  pinCode: string,
): Promise<ServiceabilityResult> {
  const area = await db.deliveryArea.findUnique({ where: { pinCode } });

  if (!area || !area.isActive) {
    return { isServiceable: false };
  }

  return {
    isServiceable: true,
    areaName: area.areaName,
    deliveryCharge: area.deliveryCharge.toNumber(),
    freeDeliveryAbove: area.freeDeliveryAbove?.toNumber() ?? null,
    minOrderValue: area.minOrderValue.toNumber(),
    estimatedMinutes: area.estimatedMinutes,
  };
}
