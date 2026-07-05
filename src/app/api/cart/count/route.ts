import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, handleApiError } from '@/lib/api-response';
import { getCartItemCount } from '@/services/cartService';

/**
 * Unauthenticated visitors get a count of 0 rather than a 401 — the
 * header badge calls this on every page, and treating "not logged in"
 * as an error would be noisy for what is a perfectly normal state.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ count: 0 });
    }

    const count = await getCartItemCount(session.user.id);
    return ok({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
