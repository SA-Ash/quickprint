/**
 * Push Notification Service - FCM Placeholder
 */

import { workerEnv } from '../config/env.js';

export const pushService = {
  async sendToUser(userId: string, notification: { title: string; body: string }) {
    if (workerEnv.USE_MOCK_PUSH) {
      console.log(`[Push Mock] User: ${userId} | ${notification.title}: ${notification.body}`);
      return { success: true };
    }
    // TODO: Implement FCM
    return { success: true };
  },

  async sendOrderNotification(userId: string, type: 'confirmed' | 'ready' | 'cancelled', orderNumber: string) {
    const messages = {
      confirmed: { title: 'Order Confirmed ✅', body: `Order ${orderNumber} confirmed` },
      ready: { title: 'Order Ready! 🎉', body: `Order ${orderNumber} is ready` },
      cancelled: { title: 'Order Cancelled ❌', body: `Order ${orderNumber} cancelled` },
    };
    return this.sendToUser(userId, messages[type]);
  },

  async sendNewOrderToShop(shopOwnerId: string, orderNumber: string) {
    return this.sendToUser(shopOwnerId, { title: 'New Order! 🔔', body: `New order: ${orderNumber}` });
  },
};
