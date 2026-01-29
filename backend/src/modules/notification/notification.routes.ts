import type { FastifyInstance } from 'fastify';
import { notificationController } from './notification.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // All notification routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  // Get all notifications
  fastify.get('/', notificationController.getNotifications);

  // Mark a specific notification as read
  fastify.patch('/:id/read', notificationController.markAsRead);

  // Mark all notifications as read
  fastify.patch('/read-all', notificationController.markAllAsRead);

  // Delete a specific notification
  fastify.delete('/:id', notificationController.deleteNotification);

  // Clear all notifications
  fastify.delete('/', notificationController.clearAllNotifications);
}

export default notificationRoutes;
