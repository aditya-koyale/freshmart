'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { apiRequest, ApiRequestError } from '@/lib/api-client';

interface SettingField { key: string; label: string; helperText?: string; type?: string }

const FIELD_GROUPS: { heading: string; fields: SettingField[] }[] = [
  {
    heading: 'Business Identity',
    fields: [
      { key: 'businessName', label: 'Brand Name', helperText: 'Shown to customers (e.g. FreshMart)' },
      { key: 'legalBusinessName', label: 'Legal Business Name', helperText: 'Shown on invoices (e.g. Aditya Fruit Supplier)' },
      { key: 'currency', label: 'Currency Code', helperText: 'ISO 4217 code (e.g. INR)' },
      { key: 'timeZone', label: 'Time Zone', helperText: 'e.g. Asia/Kolkata' },
    ],
  },
  {
    heading: 'Delivery & Orders',
    fields: [
      { key: 'defaultDeliveryFee', label: 'Default Delivery Fee (₹)', type: 'number', helperText: 'Used when no delivery area matches' },
      { key: 'stockReservationMinutes', label: 'Stock Reservation (minutes)', type: 'number', helperText: 'How long a stock hold is valid (SRS §6)' },
      { key: 'lowStockThresholdDefault', label: 'Low-Stock Threshold (default)', type: 'number', helperText: 'Default units below which a variant is "low stock"' },
    ],
  },
];

export function SettingsForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) { setValues((v) => ({ ...v, [key]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaved(false);
    setIsSaving(true);
    try {
      await apiRequest('/api/admin/settings', { method: 'PATCH', body: values });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Save failed.'); }
    finally { setIsSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Settings saved successfully.</Alert>}

      {FIELD_GROUPS.map((group) => (
        <section key={group.heading} className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">{group.heading}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={values[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                helperText={field.helperText}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="flex">
        <Button type="submit" isLoading={isSaving}>Save Settings</Button>
      </div>
    </form>
  );
}
