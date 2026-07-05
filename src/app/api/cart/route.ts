import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { addToCartSchema } from '@/lib/validation/cart';
import { getCart, addToCart, clearCart } from '@/services/cartService';

export async function GET() {
  try {
    const session = await requireCustomerSession();
    const cart = await getCart(session.user.id);
    return ok(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = addToCartSchema.parse(body);

    await addToCart(session.user.id, input);
    const cart = await getCart(session.user.id);

    return ok(cart, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireCustomerSession();
    await clearCart(session.user.id);
    return ok({ message: 'Cart cleared' });
  } catch (error) {
    return handleApiError(error);
  }
}
