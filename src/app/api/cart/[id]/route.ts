import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { updateCartItemSchema } from '@/lib/validation/cart';
import { updateCartItemQuantity, removeCartItem, getCart } from '@/services/cartService';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const { quantity } = updateCartItemSchema.parse(body);

    await updateCartItemQuantity(session.user.id, params.id, quantity);
    const cart = await getCart(session.user.id);

    return ok(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireCustomerSession();
    await removeCartItem(session.user.id, params.id);
    const cart = await getCart(session.user.id);

    return ok(cart);
  } catch (error) {
    return handleApiError(error);
  }
}
