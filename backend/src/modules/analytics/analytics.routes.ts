/**
 * Analytics Routes
 * Protected routes for shop analytics
 */

import { FastifyInstance } from 'fastify';
import { analyticsController } from './analytics.controller.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get analytics summary
  fastify.get('/summary', analyticsController.getSummary);

  // Get revenue trends
  fastify.get('/trends', analyticsController.getRevenueTrends);

  // Get popular services
  fastify.get('/services', analyticsController.getPopularServices);
}

export default analyticsRoutes;
