import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event.types.js';
import type {
  OrderCreatedPayload,
  OrderConfirmedPayload,
  OrderReadyPayload,
  OrderCompletedPayload,
  OrderCancelledPayload,
} from '../event.types.js';

export const orderPublisher = {
  async publishOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.ORDER_CREATED, payload);
  },

  async publishOrderConfirmed(payload: OrderConfirmedPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.ORDER_CONFIRMED, payload);
  },

  async publishOrderReady(payload: OrderReadyPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.ORDER_READY, payload);
  },

  async publishOrderCompleted(payload: OrderCompletedPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.ORDER_COMPLETED, payload);
  },

  async publishOrderCancelled(payload: OrderCancelledPayload): Promise<void> {
    await eventBus.publish(EVENT_TYPES.ORDER_CANCELLED, payload);
  },
};
