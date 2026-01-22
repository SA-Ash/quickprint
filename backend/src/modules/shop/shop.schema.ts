import { z } from 'zod';

// Get nearby shops
export const nearbyShopsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(50).default(5), // km
});

export type NearbyShopsInput = z.infer<typeof nearbyShopsSchema>;

// Update shop details
export const updateShopSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(6).max(6),
  }).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  services: z.object({
    colorPrinting: z.boolean(),
    binding: z.boolean(),
    lamination: z.boolean(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateShopInput = z.infer<typeof updateShopSchema>;

// Update pricing
export const updatePricingSchema = z.object({
  bwSingle: z.number().min(0).optional(),
  bwDouble: z.number().min(0).optional(),
  colorSingle: z.number().min(0).optional(),
  colorDouble: z.number().min(0).optional(),
  binding: z.number().min(0).optional(),
  lamination: z.number().min(0).optional(),
});

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;

// Shop response types
export interface ShopAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ShopLocation {
  lat: number;
  lng: number;
}

export interface ShopServices {
  colorPrinting: boolean;
  binding: boolean;
  lamination: boolean;
}

export interface ShopPricing {
  bwSingle: number;
  bwDouble: number;
  colorSingle: number;
  colorDouble: number;
  binding?: number;
  lamination?: number;
}

export interface ShopResponse {
  id: string;
  ownerId: string;
  businessName: string;
  address: ShopAddress;
  location: ShopLocation;
  services: ShopServices;
  pricing: ShopPricing;
  rating: number;
  isActive: boolean;
  distance?: number; // km, only for nearby searches
}
