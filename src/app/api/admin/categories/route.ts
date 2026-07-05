import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { categorySchema } from '@/lib/validation/category';
import { listAdminCategories, createCategory } from '@/services/categoryService';
import { recordAuditLog } from '@/services/auditLogService';

export async function GET() {
  try {
    await requireAdminSession();
    const categories = await listAdminCategories();
    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const input = categorySchema.parse(body);

    const category = await createCategory(input);

    await recordAuditLog({
      userId: session.user.id,
      action: 'CATEGORY_CREATED',
      entity: 'Category',
      entityId: category.id,
      metadata: { name: category.name },
    });

    return ok(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
