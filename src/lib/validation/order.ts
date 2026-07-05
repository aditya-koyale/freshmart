import { z } from 'zod';

export const placeOrderSchema = z.object({
  addressId: z.string().uuid(),
  deliverySlotId: z.string().uuid().optional(),
  couponCode: z.string().trim().max(40).optional(),
  customerNote: z.string().trim().max(500).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
