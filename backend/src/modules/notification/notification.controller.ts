import type { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service.js';
import { notificationIdParamSchema } from './notification.schema.js';

type AuthenticatedRequest = FastifyRequest & {
  user: NonNullable<FastifyRequest['user']>;
};

export const notificationController = {
  /**
   * Get all notifications for current user
   */
  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const notifications = await notificationService.getUserNotifications(req.user.id);
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      return reply.code(200).send({ notifications, unreadCount });
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return reply.code(500).send({ error: 'Failed to get notifications' });
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const params = notificationIdParamSchema.parse(request.params);
      const notification = await notificationService.markAsRead(params.id, req.user.id);
      return reply.code(200).send(notification);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Notification not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update notification' });
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      await notificationService.markAllAsRead(req.user.id);
      return reply.code(200).send({ message: 'All notifications marked as read' });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to update notifications' });
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const params = notificationIdParamSchema.parse(request.params);
      await notificationService.deleteNotification(params.id, req.user.id);
      return reply.code(200).send({ message: 'Notification deleted' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Notification not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to delete notification' });
    }
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      await notificationService.clearAllNotifications(req.user.id);
      return reply.code(200).send({ message: 'All notifications cleared' });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to clear notifications' });
    }
  },
};
