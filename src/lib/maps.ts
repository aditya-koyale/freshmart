/**
 * Thin wrapper around the Google Maps APIs used for delivery-address
 * autocomplete and PIN-code resolution (SRS Part 1 §18, Part 3 §7).
 * Kept isolated behind this module so the maps provider could be swapped
 * later without touching checkout/address code (Part 10 §19).
 */

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface GeocodeResult {
  formattedAddress: string;
  pinCode: string | null;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    return null;
  }

  const result = data.results[0];
  const components: Array<{ long_name: string; types: string[] }> =
    result.address_components ?? [];

  const findComponent = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? null;

  return {
    formattedAddress: result.formatted_address,
    pinCode: findComponent('postal_code'),
    city: findComponent('locality'),
    state: findComponent('administrative_area_level_1'),
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  };
}
