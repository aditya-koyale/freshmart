import { z } from 'zod';

export const weightVariantSchema = z.object({
  label: z.string().trim().min(1, 'Label is required (e.g. "500g")').max(30),
  price: z.number().positive('Price must be greater than 0'),
  salePrice: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  // Initial stock for this variant, used only on creation — subsequent
  // adjustments go through the inventory endpoints (Phase 4).
  initialStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  shortDescription: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  origin: z.string().trim().max(120).optional().nullable(),
  freshnessInfo: z.string().trim().max(500).optional().nullable(),
  storageInfo: z.string().trim().max(500).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sku: z.string().trim().max(60).optional().nullable(),
  // A product must always be created with at least one purchasable
  // weight variant (decision: "Order Quantity" §2).
  weightVariants: z.array(weightVariantSchema).min(1, 'At least one weight variant is required'),
});

export const productUpdateSchema = productSchema
  .omit({ weightVariants: true })
  .partial();

export const productListQuerySchema = z.object({
  categorySlug: z.string().optional(),
  search: z.string().trim().max(100).optional(),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  seasonal: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
});

export type WeightVariantInput = z.infer<typeof weightVariantSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
