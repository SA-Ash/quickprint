import { prisma } from '../../infrastructure/database/prisma.client.js';
import type { ShopLocation, ShopServices } from '../shop/shop.schema.js';

interface PricingInput {
  shopId: string;
  userLat: number;
  userLng: number;
  printConfig: {
    pages: number;
    copies: number;
    color: boolean;
    doubleSided: boolean;
    binding?: string;
  };
}

export interface PricingBreakdown {
  baseCost: number;
  distanceKm: number;
  distanceMultiplier: number;
  surgeMultiplier: number;
  surgeReason: string | null;
  subtotal: number;
  platformFee: number;
  convenienceFee: number;
  gst: number;
  total: number;
  currency: string;
}

const PLATFORM_FEE = 2;
const CONVENIENCE_FEE_PERCENT = 0.05;
const GST_PERCENT = 0.18;
const MIN_SURGE = 1.0;
const MAX_SURGE = 2.0;
const BASE_DISTANCE_KM = 2;
const MAX_DISTANCE_MULTIPLIER = 1.5;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function isPeakHour(date: Date): boolean {
  const hour = date.getHours();
  return (hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 18);
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export const pricingService = {
  async calculatePrice(input: PricingInput): Promise<PricingBreakdown> {
    const { shopId, userLat, userLng, printConfig } = input;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new Error('Shop not found');
    }

    const shopLocation = shop.location as unknown as ShopLocation;
    const shopPricing = shop.pricing as any;

    const distanceKm = calculateDistance(userLat, userLng, shopLocation.lat, shopLocation.lng);

    const distanceMultiplier = this.getDistanceMultiplier(distanceKm);

    const { multiplier: surgeMultiplier, reason: surgeReason } = await this.getSurgeMultiplier(shopId);

    let perPageRate: number;
    if (printConfig.color) {
      perPageRate = printConfig.doubleSided 
        ? (shopPricing.colorDouble || 4) 
        : (shopPricing.colorSingle || 5);
    } else {
      perPageRate = printConfig.doubleSided 
        ? (shopPricing.bwDouble || 1.5) 
        : (shopPricing.bwSingle || 2);
    }

    const baseCost = perPageRate * printConfig.pages * printConfig.copies;

    let bindingCost = 0;
    if (printConfig.binding && printConfig.binding !== 'No Binding') {
      bindingCost = shopPricing.binding || 20;
    }

    const costWithMultipliers = (baseCost + bindingCost) * distanceMultiplier * surgeMultiplier;

    const subtotal = Math.round(costWithMultipliers * 100) / 100;

    const platformFee = PLATFORM_FEE;
    const convenienceFee = Math.round(subtotal * CONVENIENCE_FEE_PERCENT * 100) / 100;
    const gst = Math.round((platformFee + convenienceFee) * GST_PERCENT * 100) / 100;

    const total = Math.round((subtotal + platformFee + convenienceFee + gst) * 100) / 100;

    return {
      baseCost: Math.round(baseCost * 100) / 100,
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMultiplier: Math.round(distanceMultiplier * 100) / 100,
      surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
      surgeReason,
      subtotal,
      platformFee,
      convenienceFee,
      gst,
      total,
      currency: 'INR',
    };
  },

  getDistanceMultiplier(distanceKm: number): number {
    if (distanceKm <= BASE_DISTANCE_KM) {
      return 1.0;
    }

    const extraDistance = distanceKm - BASE_DISTANCE_KM;
    const multiplier = 1.0 + (extraDistance * 0.05);

    return Math.min(multiplier, MAX_DISTANCE_MULTIPLIER);
  },

  async getSurgeMultiplier(shopId: string): Promise<{ multiplier: number; reason: string | null }> {
    const now = new Date();
    
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const pendingOrders = await prisma.order.count({
      where: {
        shopId,
        status: { in: ['PENDING', 'ACCEPTED', 'PRINTING'] },
        createdAt: { gte: oneHourAgo },
      },
    });

    let surge = MIN_SURGE;
    let reason: string | null = null;

    if (pendingOrders >= 10) {
      surge += 0.5;
      reason = 'Very high demand';
    } else if (pendingOrders >= 5) {
      surge += 0.3;
      reason = 'High demand';
    } else if (pendingOrders >= 3) {
      surge += 0.1;
      reason = 'Moderate demand';
    }

    if (isPeakHour(now)) {
      surge += 0.2;
      reason = reason ? `${reason} + Peak hours` : 'Peak hours';
    }

    if (isWeekday(now) && isPeakHour(now)) {
      surge += 0.1;
    }

    surge = Math.min(surge, MAX_SURGE);

    return { 
      multiplier: Math.round(surge * 100) / 100, 
      reason: surge > 1.0 ? reason : null 
    };
  },

  async getShopSurgeInfo(shopId: string) {
    const { multiplier, reason } = await this.getSurgeMultiplier(shopId);
    
    return {
      surgeActive: multiplier > 1.0,
      multiplier,
      reason,
      level: multiplier >= 1.5 ? 'high' : multiplier >= 1.2 ? 'medium' : 'low',
    };
  },
};
