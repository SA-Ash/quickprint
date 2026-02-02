import { FastifyInstance } from 'fastify';
import { adminAnalyticsController } from './admin-analytics.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';
import { adminOnly } from '../../common/guards/index.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require authentication and admin role
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', adminOnly);

  // Dashboard endpoints
  fastify.get('/dashboard', adminAnalyticsController.getDashboardSummary);
  fastify.get('/revenue-trends', adminAnalyticsController.getRevenueTrends);
  fastify.get('/order-analytics', adminAnalyticsController.getOrderAnalytics);
  fastify.get('/recent-activity', adminAnalyticsController.getRecentActivity);
  fastify.get('/partner-stats', adminAnalyticsController.getPartnerStats);
}

export default adminRoutes;
