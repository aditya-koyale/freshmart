import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { CouponManager } from '@/components/admin/CouponManager';
export const metadata: Metadata = { title: 'Coupons — FreshMart Admin' };
export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return <CouponManager coupons={coupons.map((c) => ({
    id: c.id, code: c.code, type: c.type,
    discountValue: c.discountValue.toNumber(),
    minOrderValue: c.minOrderValue?.toNumber() ?? null,
    maxDiscount: c.maxDiscount?.toNumber() ?? null,
    usageLimit: c.usageLimit, usageCount: c._count.usages,
    firstOrderOnly: c.firstOrderOnly,
    startDate: c.startDate.toISOString(), endDate: c.endDate.toISOString(),
    isActive: c.isActive,
  }))} />;
}
