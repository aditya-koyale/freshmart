import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { applyCouponSchema } from '@/lib/validation/coupon';
import { validateCoupon } from '@/services/couponService';

export async function POST(request: Request) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const { code } = applyCouponSchema.parse(body);

    const result = await validateCoupon(session.user.id, code);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
