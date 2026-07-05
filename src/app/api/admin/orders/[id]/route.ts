import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { getAdminOrderById } from '@/services/adminOrderService';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();
    const order = await getAdminOrderById(params.id);
    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
