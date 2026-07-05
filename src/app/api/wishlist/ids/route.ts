import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, handleApiError } from '@/lib/api-response';
import { getWishlistedProductIds } from '@/services/wishlistService';

/**
 * Unauthenticated visitors get an empty list rather than a 401 — every
 * heart icon on every page checks this on mount, and "not logged in" is
 * a completely normal state here, not an error.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ productIds: [] });
    }

    const productIds = await getWishlistedProductIds(session.user.id);
    return ok({ productIds });
  } catch (error) {
    return handleApiError(error);
  }
}
