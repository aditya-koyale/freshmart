import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminCouponSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET() {
  try {
    await requireAdminSession();
    const coupons = await db.coupon.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(coupons.map((c) => ({
      ...c,
      discountValue: c.discountValue.toNumber(),
      minOrderValue: c.minOrderValue?.toNumber() ?? null,
      maxDiscount: c.maxDiscount?.toNumber() ?? null,
      usageCount: c._count.usages,
    })));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const input = adminCouponSchema.parse(await request.json());
    const coupon = await db.coupon.create({ data: {
      code: input.code, type: input.type,
      discountValue: input.discountValue,
      minOrderValue: input.minOrderValue ?? null,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      firstOrderOnly: input.firstOrderOnly,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive,
    }});
    await recordAuditLog({ userId: session.user.id, action: 'COUPON_CREATED', entity: 'Coupon', entityId: coupon.id });
    return ok(coupon, 201);
  } catch (e) { return handleApiError(e); }
}
