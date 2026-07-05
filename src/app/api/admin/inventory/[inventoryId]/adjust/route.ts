import { z } from 'zod';
import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { adjustInventoryStock } from '@/services/inventoryService';
import { recordAuditLog } from '@/services/auditLogService';

const adjustSchema = z.object({
  change: z.number().int().refine((n) => n !== 0, 'Change cannot be zero'),
  reason: z.string().trim().min(1).max(120),
});

export async function POST(
  request: Request,
  { params }: { params: { inventoryId: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = adjustSchema.parse(body);

    const updated = await adjustInventoryStock({
      inventoryId: params.inventoryId,
      change: input.change,
      reason: input.reason,
    });

    await recordAuditLog({
      userId: session.user.id,
      action: 'INVENTORY_ADJUSTED',
      entity: 'Inventory',
      entityId: params.inventoryId,
      metadata: { change: input.change, reason: input.reason, newStock: updated.stock },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
