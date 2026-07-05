export interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
}

/**
 * Shared between the product detail page (pre-add-to-cart) and the cart
 * page (post-add quantity editing) — one implementation, one set of
 * bounds-checking rules, instead of two slightly different steppers.
 */
export function QuantityStepper({
  quantity,
  min = 1,
  max,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  function decrement() {
    if (quantity > min) onChange(quantity - 1);
  }

  function increment() {
    if (quantity < max) onChange(quantity + 1);
  }

  return (
    <div className="inline-flex items-center rounded-control border border-border">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span
        className="flex h-9 w-10 items-center justify-center text-sm font-medium text-ink"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
