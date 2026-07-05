import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

/**
 * Generic surface container reused for product cards, dashboard widgets,
 * and form sections — keeps corner radius, border, and shadow consistent
 * across the whole app.
 */
export function Card({
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-card border border-border bg-surface shadow-soft',
        PADDING_CLASSES[padding],
        interactive && 'transition-shadow hover:shadow-raised',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
