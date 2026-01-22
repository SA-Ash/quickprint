/**
 * Event Types for Async Worker
 */

export const EVENT_TYPES = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_READY: 'order.ready',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  SHOP_REGISTERED: 'shop.registered',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export interface DomainEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: Date;
  id: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  shopId: string;
  orderNumber: string;
}

export interface OrderConfirmedPayload {
  orderId: string;
  userId: string;
}

export interface OrderReadyPayload {
  orderId: string;
  userId: string;
}

export interface OrderCompletedPayload {
  orderId: string;
  totalCost: number;
}

export interface OrderCancelledPayload {
  orderId: string;
  reason?: string;
}

export interface PaymentSuccessPayload {
  orderId: string;
  paymentId: string;
  amount: number;
}

export interface PaymentFailedPayload {
  orderId: string;
  reason: string;
}

export interface ShopRegisteredPayload {
  shopId: string;
  ownerId: string;
  businessName: string;
}
