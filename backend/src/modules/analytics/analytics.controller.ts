import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../common/index.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
 
  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const summary = await analyticsService.getShopSummary(req.user.id);
      return reply.send(summary);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },

 
  async getRevenueTrends(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const trends = await analyticsService.getRevenueTrends(req.user.id);
      return reply.send(trends);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },

 
  async getPopularServices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const services = await analyticsService.getPopularServices(req.user.id);
      return reply.send(services);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },
};

export default analyticsController;
