/**
 * The single source of truth for turning line items into a price
 * breakdown. Used by the Cart now (discount/delivery/tax all at zero —
 * nothing to apply yet) and reused unchanged by Checkout and Order
 * Placement later, which will pass real coupon discount and delivery
 * charge values into the same function. No other file should compute a
 * total independently.
 */

export interface PricingLineItem {
  unitPrice: number;
  quantity: number;
}

export interface PricingInput {
  items: PricingLineItem[];
  /** From the Coupon System (Module 5). Defaults to 0 — nothing yet. */
  discountAmount?: number;
  /** From the selected delivery address/area (Module 6/7). Defaults to 0. */
  deliveryCharge?: number;
  /**
   * Fresh fruit is 0%-rated under Indian GST, so this defaults to 0
   * rather than guessing a number. Exposed as a parameter (not hardcoded
   * away) so a future packaged/processed product line can pass a real
   * rate without changing this function.
   */
  taxRatePercent?: number;
}

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  taxAmount: number;
  grandTotal: number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const subtotal = round2(
    input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  // A discount can never exceed the subtotal it's discounting.
  const discountAmount = round2(Math.min(input.discountAmount ?? 0, subtotal));
  const deliveryCharge = round2(input.deliveryCharge ?? 0);

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2(taxableAmount * ((input.taxRatePercent ?? 0) / 100));

  const grandTotal = round2(taxableAmount + deliveryCharge + taxAmount);

  return { subtotal, discountAmount, deliveryCharge, taxAmount, grandTotal };
}
