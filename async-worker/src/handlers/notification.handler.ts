/**
 * Notification Handler - Consumes from RabbitMQ notifications queue
 */

import { prisma } from '../infrastructure/database/prisma.client.js';
import { smsService } from '../services/sms.service.js';
import { pushService } from '../services/push.service.js';
import { consumeFromQueue, QUEUES } from '../infrastructure/rabbitmq.client.js';

// Event types (must match backend)
const EVENT_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_READY: 'ORDER_READY',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;

interface NotificationMessage {
  eventType: string;
  payload: {
    orderId?: string;
    orderNumber?: string;
    userId?: string;
    shopId?: string;
    amount?: number;
    reason?: string;
  };
  timestamp: string;
}

async function handleNotificationMessage(message: NotificationMessage): Promise<void> {
  const { eventType, payload } = message;
  console.log(`[NotificationHandler] Processing: ${eventType}`);

  switch (eventType) {
    case EVENT_TYPES.ORDER_CREATED: {
      const shop = await prisma.shop.findUnique({
        where: { id: payload.shopId },
        include: { owner: { select: { phone: true } } },
      });
      if (shop?.owner?.phone) {
        await smsService.sendOrderCreated(shop.owner.phone, payload.orderNumber || 'Unknown');
        await pushService.sendNewOrderToShop(shop.ownerId, payload.orderNumber || 'Unknown');
      }
      break;
    }

    case EVENT_TYPES.ORDER_CONFIRMED: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: {
          user: { select: { phone: true } },
          shop: { select: { businessName: true } },
        },
      });
      if (order?.user?.phone) {
        await smsService.sendOrderConfirmed(order.user.phone, order.orderNumber, order.shop.businessName);
        await pushService.sendOrderNotification(payload.userId || '', 'confirmed', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.ORDER_READY: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: {
          user: { select: { phone: true } },
          shop: { select: { businessName: true } },
        },
      });
      if (order?.user?.phone) {
        await smsService.sendOrderReady(order.user.phone, order.orderNumber, order.shop.businessName);
        await pushService.sendOrderNotification(payload.userId || '', 'ready', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.ORDER_CANCELLED: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { user: { select: { phone: true, id: true } } },
      });
      if (order?.user?.phone) {
        await smsService.sendOrderCancelled(order.user.phone, order.orderNumber, payload.reason);
        await pushService.sendOrderNotification(order.user.id, 'cancelled', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.PAYMENT_SUCCESS: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { user: { select: { phone: true } } },
      });
      if (order?.user?.phone && payload.amount) {
        await smsService.sendPaymentConfirmation(order.user.phone, payload.amount / 100, order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.PAYMENT_FAILED: {
      console.log(`[NotificationHandler] Payment failed for order ${payload.orderId}: ${payload.reason}`);
      // Could send SMS about failed payment if needed
      break;
    }

    default:
      console.warn(`[NotificationHandler] Unknown event type: ${eventType}`);
  }
}

export async function startNotificationConsumer(): Promise<void> {
  console.log('[NotificationHandler] Starting consumer...');
  await consumeFromQueue<NotificationMessage>(QUEUES.NOTIFICATIONS, handleNotificationMessage);
  console.log('[NotificationHandler] Consumer started');
}

// Keep old export for backwards compatibility (can be removed later)
export function registerNotificationHandlers(): void {
  console.warn('[NotificationHandler] registerNotificationHandlers is deprecated, use startNotificationConsumer instead');
}
