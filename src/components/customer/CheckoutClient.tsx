'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  CheckoutAddressSelector,
  type CheckoutAddressOption,
} from '@/components/customer/CheckoutAddressSelector';
import { DeliverySlotSelector } from '@/components/customer/DeliverySlotSelector';
import { CouponInputForm, type CouponApplyResult } from '@/components/customer/CouponInputForm';
import { CartNoticeList } from '@/components/customer/CartNoticeList';
import { formatPrice } from '@/utils/format';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import type { CheckoutQuote } from '@/services/checkoutService';
import type { AvailableDeliverySlot } from '@/services/deliverySlotService';
import type { PlacedOrderSummary } from '@/services/orderService';

export interface CheckoutClientProps {
  addresses: CheckoutAddressOption[];
  initialAddressId: string;
  initialQuote: CheckoutQuote | null;
  initialError: string | null;
  slots: AvailableDeliverySlot[];
}

/**
 * Owns the live re-quoting loop: any address or coupon change triggers a
 * fresh POST to /api/checkout/quote, which re-runs the full server-side
 * validation chain (cart, address ownership, serviceability, minimum
 * order, coupon) rather than adjusting numbers locally. The delivery
 * slot is collected here for the eventual order payload but doesn't
 * affect pricing, so selecting one doesn't trigger a re-quote.
 */
export function CheckoutClient({
  addresses,
  initialAddressId,
  initialQuote,
  initialError,
  slots,
}: CheckoutClientProps) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(initialAddressId);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [quote, setQuote] = useState(initialQuote);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);
  const [slotRequiredError, setSlotRequiredError] = useState(false);

  async function refreshQuote(overrides: {
    addressId?: string;
    couponCode?: string | null;
  }): Promise<CheckoutQuote | null> {
    const nextAddressId = overrides.addressId ?? addressId;
    const nextCouponCode =
      overrides.couponCode === undefined
        ? (quote?.appliedCouponCode ?? undefined)
        : (overrides.couponCode ?? undefined);

    setIsRefreshing(true);
    setError(null);
    try {
      const result = await apiRequest<CheckoutQuote>('/api/checkout/quote', {
        body: { addressId: nextAddressId, couponCode: nextCouponCode },
      });
      setQuote(result);
      return result;
    } catch (err) {
      setQuote(null);
      setError(
        err instanceof ApiRequestError ? err.message : 'Could not load checkout details.',
      );
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleAddressChange(id: string) {
    setAddressId(id);
    await refreshQuote({ addressId: id });
  }

  async function handleApplyCoupon(code: string): Promise<CouponApplyResult> {
    const result = await refreshQuote({ couponCode: code });
    if (!result) {
      return { ok: false, message: 'Could not apply coupon. Please try again.' };
    }
    if (result.couponError) {
      return { ok: false, message: result.couponError };
    }
    return { ok: true };
  }

  async function handleRemoveCoupon() {
    await refreshQuote({ couponCode: null });
  }

  async function handlePlaceOrder() {
    if (!quote) return;

    // If slots are configured at all, a selection is required — an order
    // with no scheduled window despite slots being offered would be a
    // gap, not a valid "no preference" state.
    if (slots.length > 0 && !slotId) {
      setSlotRequiredError(true);
      return;
    }
    setSlotRequiredError(false);

    setIsPlacingOrder(true);
    setPlaceOrderError(null);
    try {
      const order = await apiRequest<PlacedOrderSummary>('/api/orders', {
        body: {
          addressId,
          deliverySlotId: slotId ?? undefined,
          couponCode: quote.appliedCouponCode ?? undefined,
        },
      });
      router.push(`/orders/${order.id}/confirmation`);
    } catch (err) {
      setPlaceOrderError(
        err instanceof ApiRequestError ? err.message : 'Could not place your order. Please try again.',
      );
      setIsPlacingOrder(false);
    }
  }

  // Hard-failure state (empty cart, unserviceable address, minimum order
  // not met) — still lets the customer switch addresses to try to
  // resolve it, rather than dead-ending the page.
  if (error && !quote) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <Alert variant="error">{error}</Alert>
        <Card padding="lg">
          <CheckoutAddressSelector
            addresses={addresses}
            selectedId={addressId}
            onSelect={handleAddressChange}
          />
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <CartNoticeList notices={quote.cart.notices} />

        <Card padding="lg">
          <CheckoutAddressSelector
            addresses={addresses}
            selectedId={addressId}
            onSelect={handleAddressChange}
          />
        </Card>

        {slots.length > 0 && (
          <Card padding="lg">
            <DeliverySlotSelector slots={slots} selectedId={slotId} onSelect={setSlotId} />
            {slotRequiredError && (
              <p role="alert" className="mt-2 text-sm text-error">
                Please select a delivery slot to continue.
              </p>
            )}
          </Card>
        )}

        <Card padding="lg">
          <h2 className="font-display text-sm font-semibold text-ink">
            Order Items ({quote.cart.itemCount})
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {quote.cart.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-muted">
                  {item.productName} ({item.variantLabel}) &times; {item.quantity}
                </span>
                <span className="font-medium text-ink">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card padding="lg" className="sticky top-20">
          <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>

          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="text-ink">{formatPrice(quote.pricing.subtotal)}</dd>
            </div>
            {quote.pricing.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-success">Coupon ({quote.appliedCouponCode})</dt>
                <dd className="text-success">−{formatPrice(quote.pricing.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-muted">Delivery ({quote.deliveryAreaName})</dt>
              <dd className="text-ink">
                {quote.pricing.deliveryCharge === 0
                  ? 'Free'
                  : formatPrice(quote.pricing.deliveryCharge)}
              </dd>
            </div>
            {quote.pricing.taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="text-ink">{formatPrice(quote.pricing.taxAmount)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between font-display text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatPrice(quote.pricing.grandTotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Estimated delivery within {quote.estimatedMinutes} minutes of confirmation.
            </p>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <CouponInputForm
              appliedCode={quote.appliedCouponCode}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              disabled={isRefreshing}
            />
          </div>

          {placeOrderError && (
            <div className="mt-4">
              <Alert variant="error">{placeOrderError}</Alert>
            </div>
          )}

          <Button
            fullWidth
            className="mt-5"
            isLoading={isPlacingOrder}
            disabled={isRefreshing || isPlacingOrder}
            onClick={handlePlaceOrder}
          >
            Place Order (Cash on Delivery)
          </Button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Pay with cash when your order is delivered.
          </p>
        </Card>
      </div>
    </div>
  );
}
