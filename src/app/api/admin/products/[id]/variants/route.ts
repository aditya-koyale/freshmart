import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { weightVariantSchema } from '@/lib/validation/product';
import { addWeightVariant } from '@/services/productService';
import { recordAuditLog } from '@/services/auditLogService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = weightVariantSchema.parse(body);

    const variant = await addWeightVariant(params.id, input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'WEIGHT_VARIANT_ADDED',
      entity: 'Product',
      entityId: params.id,
      metadata: { label: variant.label },
    });

    return ok(variant, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
