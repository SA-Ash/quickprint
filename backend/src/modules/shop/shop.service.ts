import { prisma } from '../../infrastructure/database/prisma.client.js';
import type {
  NearbyShopsInput,
  UpdateShopInput,
  UpdatePricingInput,
  ShopResponse,
  ShopAddress,
  ShopLocation,
  ShopServices,
  ShopPricing,
} from './shop.schema.js';

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatShopResponse(shop: any, distance?: number): ShopResponse {
  return {
    id: shop.id,
    ownerId: shop.ownerId,
    businessName: shop.businessName,
    address: shop.address as ShopAddress,
    location: shop.location as ShopLocation,
    services: shop.services as ShopServices,
    pricing: shop.pricing as ShopPricing,
    rating: shop.rating,
    isActive: shop.isActive,
    ...(distance !== undefined && { distance: Math.round(distance * 100) / 100 }),
  };
}

export const shopService = {
  async getNearbyShops(input: NearbyShopsInput): Promise<ShopResponse[]> {
    const { lat, lng, radius } = input;

    const shops = await prisma.shop.findMany({
      where: { isActive: true },
    });

    const nearbyShops = shops
      .map((shop) => {
        const shopLocation = shop.location as unknown as ShopLocation;
        const distance = calculateDistance(lat, lng, shopLocation.lat, shopLocation.lng);
        return { shop, distance };
      })
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyShops.map(({ shop, distance }) => formatShopResponse(shop, distance));
  },

  async getShopById(shopId: string): Promise<ShopResponse | null> {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) return null;
    return formatShopResponse(shop);
  },

  async getShopByOwnerId(ownerId: string): Promise<ShopResponse | null> {
    const shop = await prisma.shop.findUnique({
      where: { ownerId },
    });

    if (!shop) return null;
    return formatShopResponse(shop);
  },

  async updateShop(shopId: string, ownerId: string, input: UpdateShopInput): Promise<ShopResponse> {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      throw new Error('Shop not found');
    }
    if (existingShop.ownerId !== ownerId) {
      throw new Error('Not authorized to update this shop');
    }

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(input.businessName && { businessName: input.businessName }),
        ...(input.address && { address: input.address }),
        ...(input.location && { location: input.location }),
        ...(input.services && { services: input.services }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return formatShopResponse(shop);
  },

  async updatePricing(shopId: string, ownerId: string, input: UpdatePricingInput): Promise<ShopResponse> {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      throw new Error('Shop not found');
    }
    if (existingShop.ownerId !== ownerId) {
      throw new Error('Not authorized to update this shop');
    }

    const currentPricing = existingShop.pricing as unknown as ShopPricing;
    const newPricing = { ...currentPricing, ...input };

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { pricing: newPricing },
    });

    return formatShopResponse(shop);
  },

  async getAllShops(): Promise<ShopResponse[]> {
    const shops = await prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
    });

    return shops.map((shop) => formatShopResponse(shop));
  },

  async toggleShopActive(shopId: string, ownerId: string, isActive: boolean): Promise<ShopResponse> {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      throw new Error('Shop not found');
    }
    if (existingShop.ownerId !== ownerId) {
      throw new Error('Not authorized to update this shop');
    }

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isActive },
    });

    return formatShopResponse(shop);
  },
};
