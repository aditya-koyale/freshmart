import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { placeOrderSchema } from '@/lib/validation/order';
import { placeOrder } from '@/services/orderService';

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = placeOrderSchema.parse(body);

    const order = await placeOrder(session.user.id, input);
    return ok(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
