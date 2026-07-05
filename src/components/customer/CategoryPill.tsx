import Image from 'next/image';
import Link from 'next/link';

export interface CategoryPillData {
  slug: string;
  name: string;
  iconUrl?: string | null;
}

/**
 * Small round category shortcut used in the homepage category rail and
 * the header's category menu.
 */
export function CategoryPill({ category }: { category: CategoryPillData }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex flex-col items-center gap-2 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {category.iconUrl ? (
          <Image src={category.iconUrl} alt="" width={32} height={32} />
        ) : (
          <CategoryFallbackIcon />
        )}
      </span>
      <span className="max-w-[5rem] truncate text-xs font-medium text-ink">
        {category.name}
      </span>
    </Link>
  );
}

function CategoryFallbackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
