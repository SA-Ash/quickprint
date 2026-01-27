import { z } from 'zod';

export const calculatePriceSchema = z.object({
  shopId: z.string().min(1),
  userLat: z.number().min(-90).max(90),
  userLng: z.number().min(-180).max(180),
  printConfig: z.object({
    pages: z.number().int().min(1),
    copies: z.number().int().min(1).default(1),
    color: z.boolean().default(false),
    doubleSided: z.boolean().default(false),
    binding: z.string().optional(),
  }),
});

export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
