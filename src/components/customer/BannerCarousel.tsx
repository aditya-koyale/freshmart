'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import type { PublicBanner } from '@/services/bannerService';

const AUTO_ADVANCE_MS = 5000;

/**
 * Full-width hero carousel for the homepage. Falls back to nothing —
 * the static hero is rendered by the page when banners.length === 0.
 * Auto-rotation pauses while the user hovers or interacts.
 */
export function BannerCarousel({ banners }: { banners: PublicBanner[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = banners.length;

  const next = useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setActive((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const id = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [total, paused, next]);

  if (total === 0) return null;

  const banner = banners[active]!;

  return (
    <section
      className="relative w-full overflow-hidden bg-surface-subtle"
      style={{ minHeight: '360px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured banners"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <div className="relative h-full w-full" style={{ minHeight: '360px' }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}${b.title ? `: ${b.title}` : ''}`}
            aria-hidden={i !== active}
            className={clsx(
              'absolute inset-0 transition-opacity duration-700',
              i === active ? 'opacity-100 z-10' : 'opacity-0 z-0',
            )}
          >
            {/* Background image */}
            <Image
              src={b.imageUrl}
              alt={b.title ?? 'Banner'}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* Overlay gradient so text is always readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/30 to-transparent" />

            {/* Content */}
            {(b.title || b.subtitle || b.buttonText) && (
              <div className="relative z-10 flex h-full items-center">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-4 py-16 sm:px-6">
                  {b.title && (
                    <h2 className="max-w-xl font-display text-3xl font-bold text-white sm:text-4xl drop-shadow">
                      {b.title}
                    </h2>
                  )}
                  {b.subtitle && (
                    <p className="max-w-md text-white/90 drop-shadow">{b.subtitle}</p>
                  )}
                  {b.buttonText && (
                    <Button
                      href={b.destinationLink ?? '/products'}
                      size="lg"
                      variant="secondary"
                    >
                      {b.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev / Next — only when multiple banners */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => { setPaused(true); prev(); }}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-ink shadow hover:bg-surface"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setPaused(true); next(); }}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-ink shadow hover:bg-surface"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div
            role="tablist"
            aria-label="Banner slides"
            className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2"
          >
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => { setPaused(true); setActive(i); }}
                className={clsx(
                  'h-2 rounded-full transition-all',
                  i === active ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
