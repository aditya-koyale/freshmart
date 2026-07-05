'use client';

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

export interface ImageGalleryProps {
  images: { url: string }[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-card bg-surface-subtle text-ink-faint">
        <FruitPlaceholderIcon />
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-subtle">
        <Image
          src={activeImage.url}
          alt={productName}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`${productName} image thumbnails`}
          className="flex gap-2 overflow-x-auto"
        >
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={clsx(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-control border-2',
                index === activeIndex ? 'border-primary' : 'border-transparent',
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FruitPlaceholderIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21c4.5 0 7-3.5 7-8 0-3-1.5-5-3-6 .3-1 0-2.5-1-3.5-1 1-1.5 2.2-1.5 3.2C12.8 6.2 12 6 12 6s-.8.2-1.5.7C10.5 5.7 10 4.5 9 3.5c-1 1-1.3 2.5-1 3.5-1.5 1-3 3-3 6 0 4.5 2.5 8 7 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
