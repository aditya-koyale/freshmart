'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import { CouponInputForm, type CouponApplyResult } from '@/components/customer/CouponInputForm';
import type { PricingBreakdown } from '@/services/pricingService';

interface AppliedCoupon {
  code: string;
  pricing: PricingBreakdown;
}

/**
 * Coupon application is a live, re-validated preview held here in local
 * state — there's nowhere server-side to persist "this cart has coupon X"
 * until an order exists (that's where Order.couponId is actually set).
 * Checkout re-runs its own coupon validation (via checkoutService, which
 * reuses the same couponService.validateCoupon as this page) before
 * attaching a coupon to a real order, so nothing here needs to survive a
 * page reload.
 */
export function CartSummary({ basePricing }: { basePricing: PricingBreakdown }) {
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);

  const pricing = applied?.pricing ?? basePricing;

  async function handleApply(code: string): Promise<CouponApplyResult> {
    try {
      const result = await apiRequest<{
        code: string;
        discountAmount: number;
        pricing: PricingBreakdown;
      }>('/api/coupons/validate', { body: { code } });

      setApplied({ code: result.code, pricing: result.pricing });
      return { ok: true };
    } catch (err) {
      setApplied(null);
      return {
        ok: false,
        message: err instanceof ApiRequestError ? err.message : 'Could not apply coupon.',
      };
    }
  }

  function handleRemove() {
    setApplied(null);
  }

  return (
    <Card padding="lg" className="sticky top-20">
      <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="text-ink">{formatPrice(pricing.subtotal)}</dd>
        </div>
        {pricing.discountAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-success">Coupon ({applied?.code})</dt>
            <dd className="text-success">−{formatPrice(pricing.discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-muted">Delivery</dt>
          <dd className="text-ink-muted">Calculated at checkout</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex justify-between font-display text-base font-bold text-ink">
          <span>Estimated Total</span>
          <span>{formatPrice(pricing.subtotal - pricing.discountAmount)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Delivery charges and any applicable taxes are calculated at checkout.
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <CouponInputForm
          appliedCode={applied?.code ?? null}
          onApply={handleApply}
          onRemove={handleRemove}
        />
      </div>

      <Button href="/checkout" fullWidth className="mt-5">
        Proceed to Checkout
      </Button>
    </Card>
  );
}
