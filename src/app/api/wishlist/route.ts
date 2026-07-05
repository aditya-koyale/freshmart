import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { wishlistInputSchema } from '@/lib/validation/wishlist';
import { listWishlist, addToWishlist } from '@/services/wishlistService';

export async function GET() {
  try {
    const session = await requireCustomerSession();
    const wishlist = await listWishlist(session.user.id);
    return ok(wishlist);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const { productId } = wishlistInputSchema.parse(body);

    await addToWishlist(session.user.id, productId);
    return ok({ message: 'Added to wishlist' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
