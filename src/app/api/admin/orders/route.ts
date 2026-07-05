import { z } from 'zod';
import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { listAdminOrders } from '@/services/adminOrderService';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);

    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(50).default(20),
      search: z.string().trim().optional(),
      status: z.string().optional(),
    }).parse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const result = await listAdminOrders({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
