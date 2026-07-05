import { z } from 'zod';

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Enter a coupon code').max(40),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
