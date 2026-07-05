import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { weightVariantSchema } from '@/lib/validation/product';
import { updateWeightVariant, removeWeightVariant } from '@/services/productService';
import { recordAuditLog } from '@/services/auditLogService';

const partialVariantSchema = weightVariantSchema
  .pick({ label: true, price: true, salePrice: true, isActive: true })
  .partial();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; variantId: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = partialVariantSchema.parse(body);

    const variant = await updateWeightVariant(params.variantId, input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'WEIGHT_VARIANT_UPDATED',
      entity: 'Product',
      entityId: params.id,
      metadata: { variantId: params.variantId, ...input },
    });

    return ok(variant);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Removing a variant that has order history deactivates it instead of
 * deleting it (see productService.removeWeightVariant) — the response
 * shape is the same either way so the admin UI doesn't need to branch.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; variantId: string } },
) {
  try {
    const session = await requireAdminSession();
    const variant = await removeWeightVariant(params.variantId);

    await recordAuditLog({
      userId: session.user.id,
      action: 'WEIGHT_VARIANT_REMOVED',
      entity: 'Product',
      entityId: params.id,
      metadata: { variantId: params.variantId },
    });

    return ok(variant);
  } catch (error) {
    return handleApiError(error);
  }
}
