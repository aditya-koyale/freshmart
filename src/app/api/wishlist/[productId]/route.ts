import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { removeFromWishlist } from '@/services/wishlistService';

export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await requireCustomerSession();
    await removeFromWishlist(session.user.id, params.productId);
    return ok({ message: 'Removed from wishlist' });
  } catch (error) {
    return handleApiError(error);
  }
}
