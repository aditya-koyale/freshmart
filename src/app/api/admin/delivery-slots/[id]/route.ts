import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminDeliverySlotSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const slot = await db.deliverySlot.findUnique({ where: { id: params.id } });
    if (!slot) throw new NotFoundError('Delivery slot not found');
    const input = adminDeliverySlotSchema.partial().parse(await request.json());
    const updated = await db.deliverySlot.update({
      where: { id: params.id },
      data: {
        ...(input.date && { date: new Date(`${input.date}T00:00:00.000Z`) }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.maxOrders !== undefined && { maxOrders: input.maxOrders }),
        ...(input.isDisabled !== undefined && { isDisabled: input.isDisabled }),
      },
    });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_SLOT_UPDATED', entity: 'DeliverySlot', entityId: params.id });
    return ok(updated);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const slot = await db.deliverySlot.findUnique({ where: { id: params.id } });
    if (!slot) throw new NotFoundError('Delivery slot not found');
    await db.deliverySlot.delete({ where: { id: params.id } });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_SLOT_DELETED', entity: 'DeliverySlot', entityId: params.id });
    return ok({ message: 'Slot deleted' });
  } catch (e) { return handleApiError(e); }
}
