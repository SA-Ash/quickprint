import type { FastifyInstance } from 'fastify';
import { reviewController } from './review.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function reviewRoutes(fastify: FastifyInstance) {
  fastify.get('/shops/:shopId/reviews', reviewController.getShopReviews);

  fastify.register(async (protectedInstance) => {
    protectedInstance.addHook('preHandler', authMiddleware);

    protectedInstance.post('/', reviewController.createReview);
    protectedInstance.put('/:id', reviewController.updateReview);
    protectedInstance.delete('/:id', reviewController.deleteReview);
    protectedInstance.get('/shops/:shopId/my', reviewController.getUserReview);
  });
}
