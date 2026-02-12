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
    name: shop.businessName, // Alias for frontend compatibility
    phone: shop.phone || null,
    email: shop.email || null,
    address: shop.address as ShopAddress,
    location: shop.location as ShopLocation,
    services: shop.services as ShopServices,
    pricing: shop.pricing as ShopPricing,
    serviceAreas: shop.serviceAreas || [],
    rating: shop.rating,
    reviewCount: shop.reviewCount || 0,
    description: shop.description || null,
    operatingHours: shop.operatingHours as Record<string, string> | null,
    isActive: shop.isActive,
    ...(distance !== undefined && { distance: Math.round(distance * 100) / 100 }),
  };
}

export const shopService = {
  async getNearbyShops(input: NearbyShopsInput): Promise<ShopResponse[]> {
    const { lat, lng, radius, userCollege } = input;
    const radiusKm = radius / 1000;
    const RATING_WEIGHT = 0.4;
    const DISTANCE_WEIGHT = 0.6;

    const shops = await prisma.shop.findMany({
      where: { isActive: true },
    });

<<<<<<< HEAD
    const scoredShops = shops
      .filter((shop) => {
        // Skip shops without valid location data
        const loc = shop.location as unknown as ShopLocation | null;
        if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
          return false;
        }
        
        // Filter by service areas - shop must have active service areas to be visible
        const serviceAreas = (shop.serviceAreas as Array<{ name: string; active?: boolean }>) || [];
        
        // If shop has no service areas defined, it's not visible to users
        if (serviceAreas.length === 0) {
          return false;
        }
        
        // Check for active service areas (default to active if not specified)
        const activeAreas = serviceAreas.filter(a => a.active !== false);
        if (activeAreas.length === 0) {
          return false;
        }
        
        // If user has a college, only show shops that serve that area
        if (userCollege) {
          const userCollegeLower = userCollege.toLowerCase().trim();
          return activeAreas.some(area => {
            const areaNameLower = area.name.toLowerCase().trim();
            // Match if area name contains user's college or vice versa
            return areaNameLower.includes(userCollegeLower) || 
                   userCollegeLower.includes(areaNameLower);
          });
        }
        
        // No college filter - show all shops with active service areas
        return true;
      })
      .map((shop) => {
        const shopLocation = shop.location as unknown as ShopLocation;
        const distance = calculateDistance(lat, lng, shopLocation.lat, shopLocation.lng);
=======
    type ScoredShop = { shop: typeof shops[number]; distance: number; score: number };

    const scoredShops: ScoredShop[] = shops
      .map((shop): ScoredShop | null => {
        // Calculate distance to shop's own location (if valid)
        const shopLocation = shop.location as unknown as ShopLocation | null;
        let minDistance = Infinity;

        if (shopLocation && typeof shopLocation.lat === 'number' && typeof shopLocation.lng === 'number') {
          minDistance = calculateDistance(lat, lng, shopLocation.lat, shopLocation.lng);
        }

        // Also check distance to each active service area that has coordinates
        const serviceAreas = (shop.serviceAreas || []) as unknown as Array<{
          lat?: number;
          lng?: number;
          active?: boolean;
        }>;

        for (const area of serviceAreas) {
          if (area.active !== false && typeof area.lat === 'number' && typeof area.lng === 'number') {
            const areaDistance = calculateDistance(lat, lng, area.lat, area.lng);
            if (areaDistance < minDistance) {
              minDistance = areaDistance;
            }
          }
        }

        // Skip shops with no valid location data at all
        if (minDistance === Infinity) {
          return null;
        }

>>>>>>> ebc7e45 (Fix: Location fix)
        const normalizedRating = shop.rating / 5;
        const normalizedDistance = Math.min(minDistance, radiusKm) / radiusKm;
        const score = (normalizedRating * RATING_WEIGHT) + ((1 - normalizedDistance) * DISTANCE_WEIGHT);
        return { shop, distance: minDistance, score };
      })
      .filter((entry): entry is ScoredShop => entry !== null && entry.distance <= radiusKm)
      .sort((a, b) => b.score - a.score);

    return scoredShops.map(({ shop, distance }) => formatShopResponse(shop, distance));
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

  async getShopDetails(shopId: string, userLat?: number, userLng?: number, userId?: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) return null;

    const [reviews, photos, allReviews, userReview] = await Promise.all([
      prisma.review.findMany({
        where: { shopId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.shopPhoto.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.review.findMany({
        where: { shopId },
        select: { rating: true },
      }),
      userId ? prisma.review.findUnique({
        where: { userId_shopId: { userId, shopId } },
        include: { user: { select: { name: true } } },
      }) : null,
    ]);

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) {
      ratingBreakdown[r.rating]++;
    }

    let distance: number | undefined;
    if (userLat !== undefined && userLng !== undefined) {
      const shopLocation = shop.location as unknown as ShopLocation;
      distance = calculateDistance(userLat, userLng, shopLocation.lat, shopLocation.lng);
    }

    return {
      shop: formatShopResponse(shop, distance),
      reviews: {
        items: reviews.map((r) => ({
          id: r.id,
          userId: r.userId,
          userName: r.user?.name || null,
          rating: r.rating,
          comment: r.comment,
          photos: r.photos,
          createdAt: r.createdAt,
        })),
        total: allReviews.length,
        averageRating: shop.rating,
      },
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        createdAt: p.createdAt,
      })),
      ratingBreakdown,
      userReview: userReview ? {
        id: userReview.id,
        rating: userReview.rating,
        comment: userReview.comment,
        photos: userReview.photos,
      } : null,
    };
  },

  async getSuggestions(shopId: string, userLat: number, userLng: number): Promise<ShopResponse[]> {
    const currentShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!currentShop) return [];

    const currentLocation = currentShop.location as unknown as ShopLocation;
    const userDistance = calculateDistance(userLat, userLng, currentLocation.lat, currentLocation.lng);
    const maxDistance = userDistance * 2.5;
    const currentServices = currentShop.services as unknown as ShopServices;

    const shops = await prisma.shop.findMany({
      where: {
        isActive: true,
        id: { not: shopId },
        rating: { gte: currentShop.rating * 0.8 },
      },
    });

    const suggestions = shops
      .map((shop) => {
        const shopLocation = shop.location as unknown as ShopLocation;
        const distance = calculateDistance(userLat, userLng, shopLocation.lat, shopLocation.lng);
        const shopServices = shop.services as unknown as ShopServices;
        const serviceMatch =
          (currentServices.colorPrinting === shopServices.colorPrinting ? 1 : 0) +
          (currentServices.binding === shopServices.binding ? 1 : 0) +
          (currentServices.lamination === shopServices.lamination ? 1 : 0);
        return { shop, distance, serviceMatch };
      })
      .filter(({ distance }) => distance <= maxDistance)
      .sort((a, b) => {
        if (b.serviceMatch !== a.serviceMatch) return b.serviceMatch - a.serviceMatch;
        if (b.shop.rating !== a.shop.rating) return b.shop.rating - a.shop.rating;
        return a.distance - b.distance;
      })
      .slice(0, 5);

    return suggestions.map(({ shop, distance }) => formatShopResponse(shop, distance));
  },

  async uploadPhoto(userId: string, shopId: string, url: string, caption?: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');

    const photo = await prisma.shopPhoto.create({
      data: { userId, shopId, url, caption: caption || null },
    });

    return {
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      createdAt: photo.createdAt,
    };
  },

  async getShopPhotos(shopId: string, limit = 20) {
    const photos = await prisma.shopPhoto.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });

    return photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      userName: p.user?.name || null,
      createdAt: p.createdAt,
    }));
  },

  async updateServiceAreas(
    shopId: string,
    ownerId: string,
    serviceAreas: Array<{
      id?: string;
      name: string;
      address?: string;
      placeId?: string;
      lat?: number;
      lng?: number;
      active?: boolean;
    }>
  ): Promise<ShopResponse> {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      throw new Error('Shop not found');
    }
    if (existingShop.ownerId !== ownerId) {
      throw new Error('Not authorized to update this shop');
    }

    // Store service areas as JSON in the shop's services field or a dedicated field
    // For now, we'll add it to a serviceAreas JSON field
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        // Store as JSON - Prisma will handle serialization
        serviceAreas: serviceAreas as any,
      },
    });

    return formatShopResponse(shop);
  },
};
