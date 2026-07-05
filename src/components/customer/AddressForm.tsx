'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { AddressAutocomplete, type ParsedAddress } from '@/components/customer/AddressAutocomplete';
import { addressSchema, type AddressInput } from '@/lib/validation/address';
import { apiRequest, ApiRequestError } from '@/lib/api-client';
import type { ServiceabilityResult } from '@/services/deliveryAreaService';

export interface AddressFormValues extends AddressInput {
  id?: string;
}

const EMPTY_VALUES: AddressInput = {
  label: 'Home',
  fullName: '',
  mobileNumber: '',
  houseNumber: '',
  buildingName: '',
  street: '',
  landmark: '',
  area: '',
  city: '',
  state: '',
  pinCode: '',
  isDefault: false,
};

export function AddressForm({ initialValues }: { initialValues?: AddressFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initialValues?.id);
  const [values, setValues] = useState<AddressInput>({ ...EMPTY_VALUES, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleAutocompleteSelect(parsed: ParsedAddress) {
    setValues((prev) => ({
      ...prev,
      street: parsed.street || prev.street,
      area: parsed.area || prev.area,
      city: parsed.city || prev.city,
      state: parsed.state || prev.state,
      pinCode: parsed.pinCode || prev.pinCode,
    }));
  }

  // Live, non-blocking serviceability check — informs the customer but
  // never prevents saving the address. See deliveryAreaService for why
  // this can't be a hard gate yet (no admin UI to configure zones until
  // Phase 4).
  useEffect(() => {
    if (!/^\d{6}$/.test(values.pinCode)) {
      setServiceability(null);
      return;
    }

    let cancelled = false;
    setIsCheckingServiceability(true);

    const timeout = setTimeout(async () => {
      try {
        const result = await apiRequest<ServiceabilityResult>(
          `/api/delivery-areas/check?pinCode=${values.pinCode}`,
          { method: 'GET' },
        );
        if (!cancelled) setServiceability(result);
      } catch {
        if (!cancelled) setServiceability(null);
      } finally {
        if (!cancelled) setIsCheckingServiceability(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [values.pinCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = addressSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialValues?.id) {
        await apiRequest(`/api/addresses/${initialValues.id}`, {
          method: 'PATCH',
          body: parsed.data,
        });
      } else {
        await apiRequest('/api/addresses', { body: parsed.data });
      }

      router.push('/addresses');
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiRequestError ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <AddressAutocomplete onSelect={handleAutocompleteSelect} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Label"
          placeholder="Home, Office, etc."
          value={values.label}
          onChange={(e) => update('label', e.target.value)}
          error={fieldErrors.label}
          required
        />
        <Input
          label="Full Name"
          value={values.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          error={fieldErrors.fullName}
          required
        />
      </div>

      <Input
        label="Mobile Number"
        type="tel"
        value={values.mobileNumber}
        onChange={(e) => update('mobileNumber', e.target.value)}
        error={fieldErrors.mobileNumber}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="House / Flat No."
          value={values.houseNumber}
          onChange={(e) => update('houseNumber', e.target.value)}
          error={fieldErrors.houseNumber}
          required
        />
        <Input
          label="Building / Society (optional)"
          value={values.buildingName ?? ''}
          onChange={(e) => update('buildingName', e.target.value)}
        />
      </div>

      <Input
        label="Street"
        value={values.street}
        onChange={(e) => update('street', e.target.value)}
        error={fieldErrors.street}
        required
      />
      <Input
        label="Landmark (optional)"
        value={values.landmark ?? ''}
        onChange={(e) => update('landmark', e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Area"
          value={values.area}
          onChange={(e) => update('area', e.target.value)}
          error={fieldErrors.area}
          required
        />
        <Input
          label="PIN Code"
          inputMode="numeric"
          value={values.pinCode}
          onChange={(e) => update('pinCode', e.target.value)}
          error={fieldErrors.pinCode}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="City"
          value={values.city}
          onChange={(e) => update('city', e.target.value)}
          error={fieldErrors.city}
          required
        />
        <Input
          label="State"
          value={values.state}
          onChange={(e) => update('state', e.target.value)}
          error={fieldErrors.state}
          required
        />
      </div>

      {isCheckingServiceability && (
        <p className="text-sm text-ink-muted">Checking delivery availability…</p>
      )}
      {!isCheckingServiceability && serviceability?.isServiceable && (
        <Alert variant="success">
          We deliver to {serviceability.areaName}
          {serviceability.deliveryCharge === 0
            ? ' with free delivery.'
            : ` — delivery charge ₹${serviceability.deliveryCharge}.`}
        </Alert>
      )}
      {!isCheckingServiceability &&
        serviceability?.isServiceable === false &&
        /^\d{6}$/.test(values.pinCode) && (
          <Alert variant="warning">
            We don&apos;t currently deliver to this PIN code. You can still save this
            address, but you won&apos;t be able to check out with it yet.
          </Alert>
        )}

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={(e) => update('isDefault', e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
        />
        Set as default address
      </label>

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Save Address'}
        </Button>
        <Button variant="outline" href="/addresses">
          Cancel
        </Button>
      </div>
    </form>
  );
}
