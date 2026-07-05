import { z } from 'zod';

export const wishlistInputSchema = z.object({
  productId: z.string().uuid(),
});

export type WishlistInput = z.infer<typeof wishlistInputSchema>;
