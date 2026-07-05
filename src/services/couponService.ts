import { db } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/api-response';
import { calculatePricing, type PricingBreakdown } from '@/services/pricingService';
import { getCart } from '@/services/cartService';

export interface CouponValidationResult {
  code: string;
  discountAmount: number;
  pricing: PricingBreakdown;
}

interface RawCouponLike {
  type: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount: number | null;
}

/**
 * The raw discount a coupon produces before pricingService clamps it
 * against the subtotal. Percentage coupons respect their own
 * maxDiscount cap (coupon-specific business rule); the subtotal cap
 * itself is pricingService's job, not duplicated here.
 */
function computeRawDiscount(coupon: RawCouponLike, subtotal: number): number {
  if (coupon.type === 'PERCENTAGE') {
    const raw = subtotal * (coupon.discountValue / 100);
    return coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  return coupon.discountValue;
}

/**
 * Validates a coupon code against every rule in order, re-checking the
 * customer's actual current cart (via cartService.getCart — the same
 * stock-reconciling read used everywhere else) rather than trusting a
 * client-supplied subtotal. Throws a specific, user-readable AppError
 * for the first rule that fails.
 */
export async function validateCoupon(
  userId: string,
  rawCode: string,
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new AppError('Enter a coupon code', 400, 'COUPON_CODE_REQUIRED');
  }

  const coupon = await db.coupon.findUnique({ where: { code } });

  if (!coupon || coupon.deletedAt) {
    throw new NotFoundError('This coupon code is invalid');
  }

  if (!coupon.isActive) {
    throw new AppError('This coupon is no longer active', 400, 'COUPON_INACTIVE');
  }

  const now = new Date();
  if (now < coupon.startDate) {
    throw new AppError('This coupon isn\u2019t active yet', 400, 'COUPON_NOT_STARTED');
  }
  if (now > coupon.endDate) {
    throw new AppError('This coupon has expired', 400, 'COUPON_EXPIRED');
  }

  if (coupon.usageLimit != null) {
    const usageCount = await db.couponUsage.count({ where: { couponId: coupon.id } });
    if (usageCount >= coupon.usageLimit) {
      throw new AppError(
        'This coupon has reached its usage limit',
        400,
        'COUPON_LIMIT_REACHED',
      );
    }
  }

  if (coupon.firstOrderOnly) {
    const priorOrderCount = await db.order.count({ where: { userId } });
    if (priorOrderCount > 0) {
      throw new AppError(
        'This coupon is valid on your first order only',
        400,
        'COUPON_FIRST_ORDER_ONLY',
      );
    }
  }

  const cart = await getCart(userId);
  if (cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400, 'CART_EMPTY');
  }

  const minOrderValue = coupon.minOrderValue?.toNumber() ?? 0;
  if (cart.pricing.subtotal < minOrderValue) {
    const shortfall = Math.ceil(minOrderValue - cart.pricing.subtotal);
    throw new AppError(
      `Add \u20b9${shortfall} more to use this coupon (minimum order \u20b9${minOrderValue}).`,
      400,
      'COUPON_MIN_ORDER_NOT_MET',
    );
  }

  const rawDiscount = computeRawDiscount(
    {
      type: coupon.type,
      discountValue: coupon.discountValue.toNumber(),
      maxDiscount: coupon.maxDiscount?.toNumber() ?? null,
    },
    cart.pricing.subtotal,
  );

  const pricing = calculatePricing({
    items: cart.items.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    discountAmount: rawDiscount,
  });

  return { code: coupon.code, discountAmount: pricing.discountAmount, pricing };
}
