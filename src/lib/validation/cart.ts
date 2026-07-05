import { z } from 'zod';

/**
 * 9999 here is a technical sanity ceiling against malformed/abusive
 * input (e.g. someone posting quantity: 1e9) — NOT a business maximum
 * order quantity. Per the approved decision, the only real ceiling is
 * available stock, which is enforced separately in cartService.
 */
const quantitySchema = z.number().int().min(1).max(9999);

export const addToCartSchema = z.object({
  weightVariantId: z.string().uuid(),
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
