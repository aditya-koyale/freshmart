'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export type CouponApplyResult = { ok: true } | { ok: false; message: string };

export interface CouponInputFormProps {
  appliedCode: string | null;
  onApply: (code: string) => Promise<CouponApplyResult>;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Presentational coupon widget shared by the Cart and Checkout pages.
 * Each page wires its own validation into `onApply`: Cart validates
 * against cart-only totals (api/coupons/validate), Checkout re-validates
 * as part of the full delivery quote (api/checkout/quote). Only the
 * input/button/applied-banner shell lives here — never the validation
 * logic itself, which stays in each page's own data flow.
 */
export function CouponInputForm({
  appliedCode,
  onApply,
  onRemove,
  disabled = false,
}: CouponInputFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Enter a coupon code');
      return;
    }

    setIsSubmitting(true);
    const result = await onApply(code.trim().toUpperCase());
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  if (appliedCode) {
    return (
      <Alert variant="success">
        <div className="flex items-center justify-between gap-3">
          <span>
            Coupon <strong>{appliedCode}</strong> applied.
          </span>
          <button
            type="button"
            onClick={() => {
              onRemove();
              setCode('');
              setError(null);
            }}
            className="font-medium underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Have a coupon code?"
        placeholder="Enter code"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        error={error ?? undefined}
        disabled={disabled}
      />
      <Button type="submit" variant="outline" isLoading={isSubmitting} disabled={disabled}>
        Apply Coupon
      </Button>
    </form>
  );
}
