/**
 * Analytics Handler
 */

import { analyticsService } from '../services/analytics.service.js';
import { eventBus, EVENT_TYPES } from '../events/index.js';
import type { OrderCreatedPayload, OrderCompletedPayload, OrderCancelledPayload, PaymentSuccessPayload, PaymentFailedPayload, ShopRegisteredPayload } from '../events/index.js';

export function registerAnalyticsHandlers(): void {
  console.log('[AnalyticsHandler] Registering...');

  eventBus.subscribe<OrderCreatedPayload>(EVENT_TYPES.ORDER_CREATED, async (event) => {
    await analyticsService.logOrderEvent('order.created', event.payload);
  });

  eventBus.subscribe<OrderCompletedPayload>(EVENT_TYPES.ORDER_COMPLETED, async (event) => {
    await analyticsService.logOrderEvent('order.completed', event.payload);
  });

  eventBus.subscribe<OrderCancelledPayload>(EVENT_TYPES.ORDER_CANCELLED, async (event) => {
    await analyticsService.logOrderEvent('order.cancelled', event.payload);
  });

  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    await analyticsService.logPaymentEvent('payment.success', event.payload);
  });

  eventBus.subscribe<PaymentFailedPayload>(EVENT_TYPES.PAYMENT_FAILED, async (event) => {
    await analyticsService.logPaymentEvent('payment.failed', event.payload);
  });

  eventBus.subscribe<ShopRegisteredPayload>(EVENT_TYPES.SHOP_REGISTERED, async (event) => {
    await analyticsService.logShopEvent('shop.registered', event.payload);
  });

  console.log('[AnalyticsHandler] Registered');
}
