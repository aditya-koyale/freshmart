import { forwardRef } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary disabled:bg-primary/50',
  secondary:
    'bg-accent text-white hover:bg-accent-light focus-visible:outline-accent disabled:bg-accent/50',
  outline:
    'border border-border bg-transparent text-ink hover:bg-surface-subtle focus-visible:outline-primary',
  ghost: 'bg-transparent text-ink hover:bg-surface-subtle focus-visible:outline-primary',
  danger: 'bg-error text-white hover:opacity-90 focus-visible:outline-error',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-control font-medium transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Single Button primitive used across the entire app. Renders a real
 * `<button>` by default, or a Next.js `<Link>` when `href` is supplied —
 * this avoids every feature re-implementing "link that looks like a
 * button" (instruction: reuse components, avoid duplicate code).
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      children,
      ...rest
    } = props;

    const classes = clsx(
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      fullWidth && 'w-full',
      className,
    );

    if ('href' in props && props.href) {
      const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <Link
          href={props.href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-disabled={isLoading || undefined}
          {...anchorRest}
        >
          {isLoading ? <Spinner /> : null}
          {children}
        </Link>
      );
    }

    const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={isLoading || buttonRest.disabled}
        aria-busy={isLoading || undefined}
        {...buttonRest}
      >
        {isLoading ? <Spinner /> : null}
        {children}
      </button>
    );
  },
);

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
