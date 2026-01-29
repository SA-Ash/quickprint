import { prisma } from '../../infrastructure/database/prisma.client.js';
import type { CreateNotificationInput } from './notification.schema.js';
import { wsGateway, WS_EVENTS } from '../../websocket/index.js';

export const notificationService = {
  /**
   * Create a new notification and emit via WebSocket
   */
  async createNotification(userId: string, data: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        orderId: data.orderId,
      },
    });

    // Emit to user via WebSocket
    wsGateway.emitToUser(userId, WS_EVENTS.NOTIFICATION_NEW, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    return notification;
  },

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized to update this notification');
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized to delete this notification');
    }

    return prisma.notification.delete({
      where: { id },
    });
  },

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },
};
