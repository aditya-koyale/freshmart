import { ok, handleApiError, NotFoundError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminDeliverySlotSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const now = new Date();
    const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slots = await db.deliverySlot.findMany({
      where: { date: { gte: from } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return ok(slots);
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const input = adminDeliverySlotSchema.parse(await request.json());
    const slot = await db.deliverySlot.create({
      data: {
        date: new Date(`${input.date}T00:00:00.000Z`),
        startTime: input.startTime,
        endTime: input.endTime,
        maxOrders: input.maxOrders,
        isDisabled: input.isDisabled,
      },
    });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_SLOT_CREATED', entity: 'DeliverySlot', entityId: slot.id });
    return ok(slot, 201);
  } catch (e) { return handleApiError(e); }
}
