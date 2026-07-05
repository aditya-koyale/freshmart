import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Text input with built-in label/error/helper-text wiring so every form
 * across the app (auth, checkout, admin) gets consistent accessibility
 * (label association, aria-invalid, aria-describedby) for free.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={clsx(
          'h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-ink',
          'placeholder:text-ink-faint',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-error focus:ring-error/30 focus:border-error',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-ink-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
