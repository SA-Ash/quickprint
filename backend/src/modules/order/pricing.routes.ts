import type { FastifyInstance } from 'fastify';
import { pricingController } from './pricing.controller.js';

export async function pricingRoutes(fastify: FastifyInstance): Promise<void> {
  // Calculate price for a print job
  fastify.post('/calculate-price', pricingController.calculatePrice);
  
  // Get surge info for a shop
  fastify.get('/:shopId/surge', pricingController.getShopSurge);
}
