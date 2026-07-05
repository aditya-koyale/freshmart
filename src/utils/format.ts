/**
 * INR currency formatting, used everywhere a price is displayed.
 * Centralized so a future multi-currency change (out of scope for v1)
 * touches one file instead of every component.
 */
const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return formatter.format(numeric);
}
