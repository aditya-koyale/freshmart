import { z } from 'zod';

export const adminCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  firstOrderOnly: z.boolean().default(false),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const adminBannerSchema = z.object({
  title: z.string().trim().max(100).optional().nullable(),
  subtitle: z.string().trim().max(200).optional().nullable(),
  buttonText: z.string().trim().max(40).optional().nullable(),
  destinationLink: z.string().trim().max(200).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const adminDeliveryAreaSchema = z.object({
  pinCode: z.string().trim().regex(/^\d{6}$/, 'Must be a 6-digit PIN code'),
  areaName: z.string().trim().min(2).max(80),
  deliveryCharge: z.number().min(0).default(0),
  freeDeliveryAbove: z.number().positive().optional().nullable(),
  minOrderValue: z.number().min(0).default(0),
  estimatedMinutes: z.number().int().min(1).default(60),
  isActive: z.boolean().default(true),
});

export const adminDeliverySlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  maxOrders: z.number().int().min(1).default(50),
  isDisabled: z.boolean().default(false),
});
