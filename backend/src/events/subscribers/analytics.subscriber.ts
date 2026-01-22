import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event.types.js';
import type {
  OrderCreatedPayload,
  OrderCompletedPayload,
  OrderCancelledPayload,
  PaymentSuccessPayload,
  ShopRegisteredPayload,
} from '../event.types.js';

export function registerAnalyticsSubscribers(): void {
  eventBus.subscribe<OrderCreatedPayload>(EVENT_TYPES.ORDER_CREATED, async (event) => {
    console.log(`[Analytics] Order created: ${event.payload.orderId}`);
  });

  eventBus.subscribe<OrderCompletedPayload>(EVENT_TYPES.ORDER_COMPLETED, async (event) => {
    console.log(`[Analytics] Order completed: ${event.payload.orderId}, Revenue: ₹${event.payload.totalCost}`);
  });

  eventBus.subscribe<OrderCancelledPayload>(EVENT_TYPES.ORDER_CANCELLED, async (event) => {
    console.log(`[Analytics] Order cancelled: ${event.payload.orderId}`);
  });

  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    console.log(`[Analytics] Payment recorded: ₹${event.payload.amount / 100}`);
  });

  eventBus.subscribe<ShopRegisteredPayload>(EVENT_TYPES.SHOP_REGISTERED, async (event) => {
    console.log(`[Analytics] New shop registered: ${event.payload.businessName}`);
  });

  console.log('[Analytics] Subscribers registered');
}
