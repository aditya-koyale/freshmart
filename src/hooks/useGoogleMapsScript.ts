'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: Record<string, unknown>,
          ) => {
            addListener: (event: string, handler: () => void) => { remove: () => void };
            getPlace: () => {
              address_components?: Array<{ long_name: string; types: string[] }>;
              formatted_address?: string;
            };
          };
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

/**
 * Loads the Google Maps Places script only if a public API key is
 * configured. With no key set, `isAvailable` is false and nothing is
 * ever requested from Google — this is what makes the Maps integration
 * "enable later with just an API key" rather than a hard dependency.
 */
export function useGoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isAvailable = Boolean(apiKey);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError('Address search is temporarily unavailable.');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return { isAvailable, isLoaded, error };
}
