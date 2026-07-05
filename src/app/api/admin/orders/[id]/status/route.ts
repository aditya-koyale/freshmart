import { z } from 'zod';
import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { updateOrderStatus, updateOrderInternalNote } from '@/services/adminOrderService';
import { recordAuditLog } from '@/services/auditLogService';

const ORDER_STATUSES = [
  'PENDING','CONFIRMED','PREPARING','PACKED',
  'OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED',
] as const;

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
});

const noteSchema = z.object({
  internalNote: z.string().trim().max(500),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();

    // Distinguish status update vs internal-note update by payload shape
    if ('status' in body) {
      const { status, note } = statusSchema.parse(body);
      const order = await updateOrderStatus(params.id, status, note);

      await recordAuditLog({
        userId: session.user.id,
        action: 'ORDER_STATUS_UPDATED',
        entity: 'Order',
        entityId: params.id,
        metadata: { newStatus: status, note },
      });

      return ok(order);
    }

    const { internalNote } = noteSchema.parse(body);
    const order = await updateOrderInternalNote(params.id, internalNote);
    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
