/**
 * Thin wrapper around fetch for client components talking to our own API
 * routes. Centralizes JSON parsing and the {success, message, errors}
 * envelope shape from lib/api-response.ts so every form doesn't
 * reimplement this.
 */
export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? 'POST',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(
      payload?.message ?? 'Something went wrong. Please try again.',
      response.status,
      payload?.errors,
    );
  }

  return payload.data as T;
}
