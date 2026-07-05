import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { categoryUpdateSchema } from '@/lib/validation/category';
import { updateCategory, deleteCategory } from '@/services/categoryService';
import { recordAuditLog } from '@/services/auditLogService';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = categoryUpdateSchema.parse(body);

    const category = await updateCategory(params.id, input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'CATEGORY_UPDATED',
      entity: 'Category',
      entityId: category.id,
      metadata: input,
    });

    return ok(category);
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
    const category = await deleteCategory(params.id);

    await recordAuditLog({
      userId: session.user.id,
      action: 'CATEGORY_DELETED',
      entity: 'Category',
      entityId: category.id,
    });

    return ok(category);
  } catch (error) {
    return handleApiError(error);
  }
}
