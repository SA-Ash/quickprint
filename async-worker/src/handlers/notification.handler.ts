/**
 * Notification Handler - Consumes from RabbitMQ notifications queue
 * Sends SMS and Email notifications for order events
 */

import { prisma } from '../infrastructure/database/prisma.client.js';
import { smsService } from '../services/sms.service.js';
import { emailService } from '../services/email.service.js';
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
  USER_WELCOME: 'USER_WELCOME',
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
    userName?: string;
    userEmail?: string;
    isPartner?: boolean;
  };
  timestamp: string;
}

async function handleNotificationMessage(message: NotificationMessage): Promise<void> {
  const { eventType, payload } = message;
  console.log(`[NotificationHandler] Processing: ${eventType}`);

  switch (eventType) {
    case EVENT_TYPES.ORDER_CREATED: {
      // Notify shop owner of new order
      const shop = await prisma.shop.findUnique({
        where: { id: payload.shopId },
        include: { owner: { select: { phone: true, email: true } } },
      });
      
      const order = payload.orderId ? await prisma.order.findUnique({
        where: { id: payload.orderId },
        select: { totalCost: true, user: { select: { name: true } } },
      }) : null;

      if (shop?.owner) {
        // SMS notification
        if (shop.owner.phone) {
          await smsService.sendOrderCreated(shop.owner.phone, payload.orderNumber || 'Unknown');
        }
        
        // Email notification
        if (shop.owner.email) {
          await emailService.sendOrderCreated(shop.owner.email, {
            orderNumber: payload.orderNumber || 'Unknown',
            customerName: order?.user?.name || undefined,
            totalCost: order?.totalCost ? Number(order.totalCost) : 0,
          });
        }
        
        await pushService.sendNewOrderToShop(shop.ownerId, payload.orderNumber || 'Unknown');
      }
      break;
    }

    case EVENT_TYPES.ORDER_CONFIRMED: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: {
          user: { select: { phone: true, email: true } },
          shop: { select: { businessName: true } },
        },
      });
      
      if (order?.user) {
        // SMS notification
        if (order.user.phone) {
          await smsService.sendOrderConfirmed(order.user.phone, order.orderNumber, order.shop.businessName);
        }
        
        // Email notification
        if (order.user.email) {
          await emailService.sendOrderConfirmed(order.user.email, {
            orderNumber: order.orderNumber,
            shopName: order.shop.businessName,
            totalCost: Number(order.totalCost),
          });
        }
        
        await pushService.sendOrderNotification(payload.userId || '', 'confirmed', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.ORDER_READY: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: {
          user: { select: { phone: true, email: true } },
          shop: { select: { businessName: true, address: true } },
        },
      });
      
      if (order?.user) {
        // SMS notification
        if (order.user.phone) {
          await smsService.sendOrderReady(order.user.phone, order.orderNumber, order.shop.businessName);
        }
        
        // Email notification
        if (order.user.email) {
          const shopAddress = order.shop.address as { street?: string; city?: string } | null;
          await emailService.sendOrderReady(order.user.email, {
            orderNumber: order.orderNumber,
            shopName: order.shop.businessName,
            shopAddress: shopAddress ? `${shopAddress.street || ''}, ${shopAddress.city || ''}` : undefined,
          });
        }
        
        await pushService.sendOrderNotification(payload.userId || '', 'ready', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.ORDER_CANCELLED: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { user: { select: { phone: true, email: true, id: true } } },
      });
      
      if (order?.user) {
        // SMS notification
        if (order.user.phone) {
          await smsService.sendOrderCancelled(order.user.phone, order.orderNumber, payload.reason);
        }
        
        // Email notification
        if (order.user.email) {
          await emailService.sendOrderCancelled(order.user.email, {
            orderNumber: order.orderNumber,
            reason: payload.reason,
          });
        }
        
        await pushService.sendOrderNotification(order.user.id, 'cancelled', order.orderNumber);
      }
      break;
    }

    case EVENT_TYPES.PAYMENT_SUCCESS: {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { 
          user: { select: { phone: true, email: true } },
          payment: { select: { providerPayId: true, createdAt: true } },
        },
      });
      
      if (order?.user) {
        const amount = (payload.amount || 0) / 100; // Convert paise to rupees
        
        // SMS notification
        if (order.user.phone) {
          await smsService.sendPaymentConfirmation(order.user.phone, amount, order.orderNumber);
        }
        
        // Email notification with receipt
        if (order.user.email && order.payment) {
          await emailService.sendPaymentReceipt(order.user.email, {
            orderNumber: order.orderNumber,
            amount: amount,
            paymentId: order.payment.providerPayId || 'N/A',
            date: order.payment.createdAt,
          });
        }
      }
      break;
    }

    case EVENT_TYPES.PAYMENT_FAILED: {
      console.log(`[NotificationHandler] Payment failed for order ${payload.orderId}: ${payload.reason}`);
      // Could send notification about failed payment if needed
      break;
    }

    case EVENT_TYPES.USER_WELCOME: {
      // Send welcome email for new signups
      if (payload.userEmail && payload.userName) {
        await emailService.sendWelcome(
          payload.userEmail, 
          payload.userName, 
          payload.isPartner || false
        );
      }
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
