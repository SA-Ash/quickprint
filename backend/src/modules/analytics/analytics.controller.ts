/**
 * Analytics Controller
 * Handles HTTP requests for analytics endpoints
 */

import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/index.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
 
  async getSummary(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const summary = await analyticsService.getShopSummary(request.user.id);
      return reply.send(summary);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },

 
  async getRevenueTrends(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const trends = await analyticsService.getRevenueTrends(request.user.id);
      return reply.send(trends);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },

 
  async getPopularServices(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const services = await analyticsService.getPopularServices(request.user.id);
      return reply.send(services);
    } catch (error) {
      const err = error as Error;
      return reply.status(400).send({ error: err.message });
    }
  },
};

export default analyticsController;
