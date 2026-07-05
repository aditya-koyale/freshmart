import { ok, handleApiError, NotFoundError, ConflictError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adminDeliveryAreaSchema } from '@/lib/validation/admin-module4';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET() {
  try {
    await requireAdminSession();
    const areas = await db.deliveryArea.findMany({ orderBy: { areaName: 'asc' } });
    return ok(areas.map((a) => ({
      ...a,
      deliveryCharge: a.deliveryCharge.toNumber(),
      freeDeliveryAbove: a.freeDeliveryAbove?.toNumber() ?? null,
      minOrderValue: a.minOrderValue.toNumber(),
    })));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const input = adminDeliveryAreaSchema.parse(await request.json());
    const existing = await db.deliveryArea.findUnique({ where: { pinCode: input.pinCode } });
    if (existing) throw new ConflictError('A delivery area with this PIN code already exists');
    const area = await db.deliveryArea.create({ data: input });
    await recordAuditLog({ userId: session.user.id, action: 'DELIVERY_AREA_CREATED', entity: 'DeliveryArea', entityId: area.id });
    return ok(area, 201);
  } catch (e) { return handleApiError(e); }
}
