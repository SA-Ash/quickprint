import type { FastifyInstance } from 'fastify';
import { shopController } from './shop.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function shopRoutes(fastify: FastifyInstance) {
  fastify.get('/nearby', shopController.getNearbyShops);
  fastify.get('/all', shopController.getAllShops);
  fastify.get('/:id', shopController.getShopById);
  fastify.get('/:id/details', shopController.getShopDetails);
  fastify.get('/:id/suggestions', shopController.getSuggestions);
  fastify.get('/:id/photos', shopController.getShopPhotos);

  fastify.register(async (protectedInstance) => {
    protectedInstance.addHook('preHandler', authMiddleware);

    protectedInstance.get('/me', shopController.getMyShop);
    protectedInstance.put('/:id', shopController.updateShop);
    protectedInstance.put('/:id/pricing', shopController.updatePricing);
    protectedInstance.patch('/:id/status', shopController.toggleActive);
    protectedInstance.post('/:id/photos', shopController.uploadPhoto);
  });
}

