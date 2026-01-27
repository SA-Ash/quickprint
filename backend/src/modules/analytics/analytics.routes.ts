import { FastifyInstance } from 'fastify';
import { analyticsController } from './analytics.controller.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get('/summary', analyticsController.getSummary);
  fastify.get('/trends', analyticsController.getRevenueTrends);
  fastify.get('/services', analyticsController.getPopularServices);
}

export default analyticsRoutes;
