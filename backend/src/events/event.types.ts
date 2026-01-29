
export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: Date;
  payload: T;
}

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

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

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
  userId: string;
  reason?: string;
}

export interface PaymentSuccessPayload {
  orderId: string;
  userId: string;
  amount: number;
  paymentId: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  userId: string;
  reason: string;
}

export interface ShopRegisteredPayload {
  shopId: string;
  ownerId: string;
  businessName: string;
}

export type OrderCreatedEvent = DomainEvent<OrderCreatedPayload>;
export type OrderConfirmedEvent = DomainEvent<OrderConfirmedPayload>;
export type OrderReadyEvent = DomainEvent<OrderReadyPayload>;
export type OrderCompletedEvent = DomainEvent<OrderCompletedPayload>;
export type OrderCancelledEvent = DomainEvent<OrderCancelledPayload>;
export type PaymentSuccessEvent = DomainEvent<PaymentSuccessPayload>;
export type PaymentFailedEvent = DomainEvent<PaymentFailedPayload>;
export type ShopRegisteredEvent = DomainEvent<ShopRegisteredPayload>;

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;
