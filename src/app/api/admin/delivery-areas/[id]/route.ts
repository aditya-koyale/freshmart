import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminDeliveryAreaSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const area = await db.deliveryArea.findUnique({ where: { id: params.id } });
    if (!area) throw new NotFoundError('Delivery area not found');
    const input = adminDeliveryAreaSchema.partial().parse(await request.json());
    const updated = await db.deliveryArea.update({ where: { id: params.id }, data: input });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_AREA_UPDATED', entity: 'DeliveryArea', entityId: params.id });
    return ok(updated);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const area = await db.deliveryArea.findUnique({ where: { id: params.id } });
    if (!area) throw new NotFoundError('Delivery area not found');
    await db.deliveryArea.delete({ where: { id: params.id } });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_AREA_DELETED', entity: 'DeliveryArea', entityId: params.id });
    return ok({ message: 'Delivery area deleted' });
  } catch (e) { return handleApiError(e); }
}
