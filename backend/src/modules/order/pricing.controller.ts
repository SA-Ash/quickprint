import type { FastifyRequest, FastifyReply } from 'fastify';
import { pricingService } from './pricing.service.js';
import { calculatePriceSchema } from './pricing.schema.js';

export const pricingController = {
  async calculatePrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = calculatePriceSchema.parse(request.body);
      const pricing = await pricingService.calculatePrice(input);
      return reply.code(200).send(pricing);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to calculate price' });
    }
  },

  async getShopSurge(
    request: FastifyRequest<{ Params: { shopId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { shopId } = request.params;
      const surgeInfo = await pricingService.getShopSurgeInfo(shopId);
      return reply.code(200).send(surgeInfo);
    } catch {
      return reply.code(500).send({ error: 'Failed to get surge info' });
    }
  },
};
