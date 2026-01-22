/**
 * Notification Handler
 */

import { prisma } from '../infrastructure/database/prisma.client.js';
import { smsService } from '../services/sms.service.js';
import { pushService } from '../services/push.service.js';
import { eventBus, EVENT_TYPES } from '../events/index.js';
import type { OrderCreatedPayload, OrderConfirmedPayload, OrderReadyPayload, OrderCancelledPayload, PaymentSuccessPayload } from '../events/index.js';

export function registerNotificationHandlers(): void {
  console.log('[NotificationHandler] Registering...');

  eventBus.subscribe<OrderCreatedPayload>(EVENT_TYPES.ORDER_CREATED, async (event) => {
    const { shopId, orderNumber } = event.payload;
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, include: { owner: { select: { phone: true } } } });
    if (shop?.owner?.phone) {
      await smsService.sendOrderCreated(shop.owner.phone, orderNumber);
      await pushService.sendNewOrderToShop(shop.ownerId, orderNumber);
    }
  });

  eventBus.subscribe<OrderConfirmedPayload>(EVENT_TYPES.ORDER_CONFIRMED, async (event) => {
    const { orderId, userId } = event.payload;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { phone: true } }, shop: { select: { businessName: true } } } });
    if (order?.user?.phone) {
      await smsService.sendOrderConfirmed(order.user.phone, order.orderNumber, order.shop.businessName);
      await pushService.sendOrderNotification(userId, 'confirmed', order.orderNumber);
    }
  });

  eventBus.subscribe<OrderReadyPayload>(EVENT_TYPES.ORDER_READY, async (event) => {
    const { orderId, userId } = event.payload;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { phone: true } }, shop: { select: { businessName: true } } } });
    if (order?.user?.phone) {
      await smsService.sendOrderReady(order.user.phone, order.orderNumber, order.shop.businessName);
      await pushService.sendOrderNotification(userId, 'ready', order.orderNumber);
    }
  });

  eventBus.subscribe<OrderCancelledPayload>(EVENT_TYPES.ORDER_CANCELLED, async (event) => {
    const { orderId, reason } = event.payload;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { phone: true, id: true } } } });
    if (order?.user?.phone) {
      await smsService.sendOrderCancelled(order.user.phone, order.orderNumber, reason);
      await pushService.sendOrderNotification(order.user.id, 'cancelled', order.orderNumber);
    }
  });

  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    const { orderId, amount } = event.payload;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { phone: true } } } });
    if (order?.user?.phone) {
      await smsService.sendPaymentConfirmation(order.user.phone, amount / 100, order.orderNumber);
    }
  });

  console.log('[NotificationHandler] Registered');
}
