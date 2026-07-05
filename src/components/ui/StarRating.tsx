import clsx from 'clsx';

export interface StarRatingProps {
  rating: number; // 0–5, can be fractional for averages
  size?: number;
  showValue?: boolean;
}

/**
 * Read-only star display, used on the product detail page's review list
 * now, and reusable later for admin review moderation (Phase 4) and any
 * future average-rating summary on product cards.
 */
export function StarRating({ rating, size = 16, showValue = false }: StarRatingProps) {
  const rounded = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      <span className="flex" role="img" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={clsx(index < rounded ? 'text-warning' : 'text-ink/15')}
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </span>
      {showValue && <span className="text-sm text-ink-muted">{rating.toFixed(1)}</span>}
    </span>
  );
}
