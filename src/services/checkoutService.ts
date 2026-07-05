import { AppError } from '@/lib/api-response';
import { getCart, type CartResult } from '@/services/cartService';
import { getAddress } from '@/services/addressService';
import { checkPinCodeServiceability } from '@/services/deliveryAreaService';
import { validateCoupon } from '@/services/couponService';
import { calculatePricing, type PricingBreakdown } from '@/services/pricingService';

export interface CheckoutAddressSummary {
  id: string;
  label: string;
  fullName: string;
  mobileNumber: string;
  houseNumber: string;
  buildingName: string | null;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface CheckoutQuote {
  cart: CartResult;
  address: CheckoutAddressSummary;
  deliveryAreaName: string;
  estimatedMinutes: number;
  appliedCouponCode: string | null;
  couponError: string | null;
  pricing: PricingBreakdown;
}

export interface CheckoutQuoteInput {
  addressId: string;
  couponCode?: string;
}

/**
 * Assembles a complete, server-validated delivery quote for one address +
 * (optionally) one coupon. This is re-run on every address or coupon
 * change from the client — nothing about pricing is ever computed in the
 * browser. Reuses cartService (stock-reconciled items), addressService
 * (ownership-checked address lookup), deliveryAreaService (the same
 * serviceability check used in Address Management, now enforced as a
 * hard requirement rather than advisory), couponService (the exact
 * discount math from Module 5), and pricingService (the only function
 * that ever produces a final total).
 */
export async function getCheckoutQuote(
  userId: string,
  input: CheckoutQuoteInput,
): Promise<CheckoutQuote> {
  const cart = await getCart(userId);
  if (cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
  }

  const address = await getAddress(userId, input.addressId);

  const serviceability = await checkPinCodeServiceability(address.pinCode);
  if (!serviceability.isServiceable) {
    throw new AppError(
      `We don\u2019t currently deliver to ${address.pinCode}. Please choose a different address.`,
      409,
      'UNSERVICEABLE_ADDRESS',
    );
  }

  const minOrderValue = serviceability.minOrderValue ?? 0;
  if (cart.pricing.subtotal < minOrderValue) {
    const shortfall = Math.ceil(minOrderValue - cart.pricing.subtotal);
    throw new AppError(
      `This area requires a minimum order of \u20b9${minOrderValue}. Add \u20b9${shortfall} more to continue.`,
      409,
      'MIN_ORDER_NOT_MET',
    );
  }

  const freeDeliveryAbove = serviceability.freeDeliveryAbove;
  const deliveryCharge =
    freeDeliveryAbove != null && cart.pricing.subtotal >= freeDeliveryAbove
      ? 0
      : serviceability.deliveryCharge ?? 0;

  // An invalid/expired/inapplicable coupon does not fail the whole
  // quote — it's surfaced as `couponError` so the checkout page can keep
  // showing the order review with the discount simply not applied,
  // exactly like Module 5's cart-page behavior.
  let appliedCouponCode: string | null = null;
  let couponError: string | null = null;
  let discountAmount = 0;

  if (input.couponCode) {
    try {
      const result = await validateCoupon(userId, input.couponCode);
      appliedCouponCode = result.code;
      discountAmount = result.discountAmount;
    } catch (error) {
      couponError = error instanceof Error ? error.message : 'Could not apply coupon';
    }
  }

  const pricing = calculatePricing({
    items: cart.items.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    discountAmount,
    deliveryCharge,
    // Fresh fruit is 0%-rated GST in India — see pricingService's
    // taxRatePercent doc for why this isn't hardcoded away entirely.
  });

  return {
    cart,
    address: {
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      mobileNumber: address.mobileNumber,
      houseNumber: address.houseNumber,
      buildingName: address.buildingName,
      street: address.street,
      landmark: address.landmark,
      area: address.area,
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
    },
    deliveryAreaName: serviceability.areaName ?? address.city,
    estimatedMinutes: serviceability.estimatedMinutes ?? 60,
    appliedCouponCode,
    couponError,
    pricing,
  };
}
