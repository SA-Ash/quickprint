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

export function registerNotificationSubscribers(): void {
  eventBus.subscribe<OrderCreatedPayload>(EVENT_TYPES.ORDER_CREATED, async (event) => {
  });

  eventBus.subscribe<OrderConfirmedPayload>(EVENT_TYPES.ORDER_CONFIRMED, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} confirmed for user ${event.payload.userId}`);
  });
  eventBus.subscribe<OrderReadyPayload>(EVENT_TYPES.ORDER_READY, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} is ready for pickup`);
  });
  eventBus.subscribe<OrderCancelledPayload>(EVENT_TYPES.ORDER_CANCELLED, async (event) => {
    console.log(`[Notification] Order ${event.payload.orderId} cancelled. Reason: ${event.payload.reason || 'Not specified'}`);
  });
  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    console.log(`[Notification] Payment successful for order ${event.payload.orderId}. Amount: ₹${event.payload.amount / 100}`);
  });

  eventBus.subscribe<PaymentFailedPayload>(EVENT_TYPES.PAYMENT_FAILED, async (event) => {
    console.log(`[Notification] Payment failed for order ${event.payload.orderId}. Reason: ${event.payload.reason}`);
  });

  console.log('[Notification] Subscribers registered');
}
