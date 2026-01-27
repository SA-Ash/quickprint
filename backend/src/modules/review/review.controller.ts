import type { FastifyRequest, FastifyReply } from 'fastify';
import { reviewService } from './review.service.js';
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema,
} from './review.schema.js';

export const reviewController = {
  async createReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const input = createReviewSchema.parse(request.body);
      const review = await reviewService.createReview(request.user.id, input);
      return reply.code(201).send(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('already reviewed')) {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to create review' });
    }
  },

  async updateReview(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const input = updateReviewSchema.parse(request.body);
      const review = await reviewService.updateReview(request.user.id, id, input);
      return reply.code(200).send(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Review not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update review' });
    }
  },

  async deleteReview(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      await reviewService.deleteReview(request.user.id, id);
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Review not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to delete review' });
    }
  },

  async getShopReviews(
    request: FastifyRequest<{ Params: { shopId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { shopId } = request.params;
      const { page, limit } = getReviewsSchema.parse(request.query);
      const reviews = await reviewService.getShopReviews(shopId, page, limit);
      return reply.code(200).send(reviews);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to get reviews' });
    }
  },

  async getUserReview(
    request: FastifyRequest<{ Params: { shopId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { shopId } = request.params;
      const review = await reviewService.getUserReview(request.user.id, shopId);
      return reply.code(200).send({ review });
    } catch {
      return reply.code(500).send({ error: 'Failed to get review' });
    }
  },
};
