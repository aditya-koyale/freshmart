import { z } from 'zod';

export const checkoutQuoteSchema = z.object({
  addressId: z.string().uuid(),
  couponCode: z.string().trim().max(40).optional(),
});

export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteSchema>;
