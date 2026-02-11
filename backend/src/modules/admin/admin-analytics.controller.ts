import { FastifyRequest, FastifyReply } from 'fastify';
import { adminAnalyticsService } from './admin-analytics.service.js';

export const adminAnalyticsController = {
  async getDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminAnalyticsService.getDashboardSummary();
      return reply.send(result);
    } catch (error) {
      console.error('Admin dashboard error:', error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard data' });
    }
  },

  async getRevenueTrends(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminAnalyticsService.getRevenueTrends();
      return reply.send(result);
    } catch (error) {
      console.error('Revenue trends error:', error);
      return reply.status(500).send({ error: 'Failed to fetch revenue trends' });
    }
  },

  async getOrderAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminAnalyticsService.getOrderAnalytics();
      return reply.send(result);
    } catch (error) {
      console.error('Order analytics error:', error);
      return reply.status(500).send({ error: 'Failed to fetch order analytics' });
    }
  },

  async getRecentActivity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminAnalyticsService.getRecentActivity();
      return reply.send(result);
    } catch (error) {
      console.error('Recent activity error:', error);
      return reply.status(500).send({ error: 'Failed to fetch recent activity' });
    }
  },

  async getPartnerStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminAnalyticsService.getPartnerStats();
      return reply.send(result);
    } catch (error) {
      console.error('Partner stats error:', error);
      return reply.status(500).send({ error: 'Failed to fetch partner stats' });
    }
  },
};

export default adminAnalyticsController;
