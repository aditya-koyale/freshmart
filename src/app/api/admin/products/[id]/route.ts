import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { productUpdateSchema } from '@/lib/validation/product';
import { getAdminProductById, updateProduct, deleteProduct } from '@/services/productService';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();
    const product = await getAdminProductById(params.id);
    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = productUpdateSchema.parse(body);

    const product = await updateProduct(params.id, input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product.id,
      metadata: input,
    });

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const product = await deleteProduct(params.id);

    await recordAuditLog({
      userId: session.user.id,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: product.id,
    });

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}
