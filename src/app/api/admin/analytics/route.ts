import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { getDashboardStats, getSalesTrend } from '@/services/analyticsService';

export async function GET() {
  try {
    await requireAdminSession();
    const [stats, trend] = await Promise.all([getDashboardStats(), getSalesTrend()]);
    return ok({ stats, trend });
  } catch (error) {
    return handleApiError(error);
  }
}
