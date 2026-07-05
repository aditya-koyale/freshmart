import clsx from 'clsx';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
};

export function Alert({
  variant = 'info',
  children,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={clsx('rounded-control px-3.5 py-2.5 text-sm', VARIANT_CLASSES[variant])}
    >
      {children}
    </div>
  );
}
