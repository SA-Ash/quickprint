import type { FastifyInstance } from 'fastify';
import { shopController } from './shop.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function shopRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get('/nearby', shopController.getNearbyShops);
  fastify.get('/all', shopController.getAllShops);
  fastify.get('/:id', shopController.getShopById);

  // Protected routes (require auth)
  fastify.register(async (protectedInstance) => {
    protectedInstance.addHook('preHandler', authMiddleware);

    // Get my shop (for partners)
    protectedInstance.get('/me', shopController.getMyShop);

    // Update shop details
    protectedInstance.put('/:id', shopController.updateShop);

    // Update pricing
    protectedInstance.put('/:id/pricing', shopController.updatePricing);

    // Toggle active status
    protectedInstance.patch('/:id/status', shopController.toggleActive);
  });
}
