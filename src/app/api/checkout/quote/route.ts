import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { checkoutQuoteSchema } from '@/lib/validation/checkout';
import { getCheckoutQuote } from '@/services/checkoutService';

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = checkoutQuoteSchema.parse(body);

    const quote = await getCheckoutQuote(session.user.id, input);
    return ok(quote);
  } catch (error) {
    return handleApiError(error);
  }
}
