'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';

export interface ParsedAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
}

/**
 * Renders nothing when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn't set — the
 * address form below this component already works fully with plain
 * manual fields, so the absence of a Maps key degrades to "slightly less
 * convenient," never to "broken." This is the modularity the Address
 * Management requirements asked for.
 */
export function AddressAutocomplete({
  onSelect,
}: {
  onSelect: (address: ParsedAddress) => void;
}) {
  const { isAvailable, isLoaded, error } = useGoogleMapsScript();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const components = place.address_components ?? [];
      const find = (type: string) =>
        components.find((component) => component.types.includes(type))?.long_name ?? '';

      onSelect({
        street: [find('street_number'), find('route')].filter(Boolean).join(' '),
        area: find('sublocality_level_1') || find('sublocality') || find('neighborhood'),
        city: find('locality') || find('administrative_area_level_2'),
        state: find('administrative_area_level_1'),
        pinCode: find('postal_code'),
      });
    });

    return () => listener.remove();
  }, [isLoaded, onSelect]);

  if (!isAvailable) return null;

  return (
    <Input
      ref={inputRef}
      label="Search for your address"
      placeholder="Start typing your address..."
      helperText={
        error ?? (isLoaded ? 'Pick a suggestion to autofill the fields below' : 'Loading…')
      }
      error={error ?? undefined}
    />
  );
}
