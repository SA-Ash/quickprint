import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event.types.js';
import type {
  DomainEvent,
  OrderCreatedPayload,
  OrderConfirmedPayload,
  OrderReadyPayload,
  OrderCancelledPayload,
  PaymentSuccessPayload,
  PaymentFailedPayload,
} from '../event.types.js';
import { notificationService } from '../../modules/notification/notification.service.js';
import { publishToQueue, QUEUES } from '../../infrastructure/queue/rabbitmq.client.js';

// Message types for async worker
interface NotificationQueueMessage {
  eventType: string;
  payload: unknown;
  timestamp: string;
}

export function registerNotificationSubscribers(): void {
  eventBus.subscribe<OrderCreatedPayload>(EVENT_TYPES.ORDER_CREATED, async (event) => {
    try {
      // Create in-app notification (stored in DB, sent via WebSocket)
      await notificationService.createNotification(event.payload.userId, {
        type: 'order_created',
        title: 'Order Placed Successfully',
        message: `Your order ${event.payload.orderNumber} has been placed`,
        orderId: event.payload.orderId,
      });

      // Publish to RabbitMQ for async SMS/email processing
      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.ORDER_CREATED,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create order notification:', err);
    }
  });

  eventBus.subscribe<OrderConfirmedPayload>(EVENT_TYPES.ORDER_CONFIRMED, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} confirmed for user ${event.payload.userId}`);
    try {
      await notificationService.createNotification(event.payload.userId, {
        type: 'status_update',
        title: 'Order Confirmed',
        message: `Your order has been confirmed and will be printed soon`,
        orderId: event.payload.orderId,
      });

      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.ORDER_CONFIRMED,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create confirmation notification:', err);
    }
  });

  eventBus.subscribe<OrderReadyPayload>(EVENT_TYPES.ORDER_READY, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} is ready for pickup`);
    try {
      await notificationService.createNotification(event.payload.userId, {
        type: 'order_completed',
        title: 'Order Ready for Pickup',
        message: `Your order is ready! Please collect it from the shop`,
        orderId: event.payload.orderId,
      });

      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.ORDER_READY,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create ready notification:', err);
    }
  });

  eventBus.subscribe<OrderCancelledPayload>(EVENT_TYPES.ORDER_CANCELLED, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} cancelled. Reason: ${event.payload.reason || 'Not specified'}`);
    try {
      await notificationService.createNotification(event.payload.userId, {
        type: 'status_update',
        title: 'Order Cancelled',
        message: `Your order has been cancelled${event.payload.reason ? `: ${event.payload.reason}` : ''}`,
        orderId: event.payload.orderId,
      });

      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.ORDER_CANCELLED,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create cancellation notification:', err);
    }
  });

  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    console.log(`[Notification] Payment successful for order ${event.payload.orderId}. Amount: ₹${event.payload.amount / 100}`);
    try {
      await notificationService.createNotification(event.payload.userId, {
        type: 'payment',
        title: 'Payment Successful',
        message: `Payment of ₹${event.payload.amount / 100} received for your order`,
        orderId: event.payload.orderId,
      });

      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.PAYMENT_SUCCESS,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create payment success notification:', err);
    }
  });

  eventBus.subscribe<PaymentFailedPayload>(EVENT_TYPES.PAYMENT_FAILED, async (event) => {
    console.log(`[Notification] Payment failed for order ${event.payload.orderId}. Reason: ${event.payload.reason}`);
    try {
      await notificationService.createNotification(event.payload.userId, {
        type: 'payment',
        title: 'Payment Failed',
        message: `Payment failed: ${event.payload.reason}. Please try again.`,
        orderId: event.payload.orderId,
      });

      await publishToQueue<NotificationQueueMessage>(QUEUES.NOTIFICATIONS, {
        eventType: EVENT_TYPES.PAYMENT_FAILED,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Notification] Failed to create payment failed notification:', err);
    }
  });

  console.log('[Notification] Subscribers registered');
}
