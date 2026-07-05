import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminCouponSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const coupon = await db.coupon.findUnique({ where: { id: params.id } });
    if (!coupon || coupon.deletedAt) throw new NotFoundError('Coupon not found');
    const input = adminCouponSchema.partial().parse(await request.json());
    const updated = await db.coupon.update({ where: { id: params.id }, data: {
      ...(input.code && { code: input.code }),
      ...(input.type && { type: input.type }),
      ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
      ...(input.minOrderValue !== undefined && { minOrderValue: input.minOrderValue }),
      ...(input.maxDiscount !== undefined && { maxDiscount: input.maxDiscount }),
      ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
      ...(input.firstOrderOnly !== undefined && { firstOrderOnly: input.firstOrderOnly }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    }});
    await recordAuditLog({ userId: session.user.id, action: 'COUPON_UPDATED', entity: 'Coupon', entityId: params.id });
    return ok(updated);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const coupon = await db.coupon.findUnique({ where: { id: params.id } });
    if (!coupon || coupon.deletedAt) throw new NotFoundError('Coupon not found');
    await db.coupon.update({ where: { id: params.id }, data: { deletedAt: new Date(), isActive: false } });
    await recordAuditLog({ userId: session.user.id, action: 'COUPON_DELETED', entity: 'Coupon', entityId: params.id });
    return ok({ message: 'Coupon deleted' });
  } catch (e) { return handleApiError(e); }
}
