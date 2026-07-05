import { z } from 'zod';

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const addressSchema = z.object({
  label: z.string().trim().min(1, 'Label is required (e.g. "Home")').max(30),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  mobileNumber: mobileSchema,
  houseNumber: z.string().trim().min(1, 'House/flat number is required').max(60),
  buildingName: z.string().trim().max(80).optional().nullable(),
  street: z.string().trim().min(2, 'Street is required').max(120),
  landmark: z.string().trim().max(120).optional().nullable(),
  area: z.string().trim().min(2, 'Area is required').max(80),
  city: z.string().trim().min(2, 'City is required').max(60),
  state: z.string().trim().min(2, 'State is required').max(60),
  pinCode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
