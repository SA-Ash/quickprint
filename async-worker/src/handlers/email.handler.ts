/**
 * Email Handler
 */

import { prisma } from '../infrastructure/database/prisma.client.js';
import { emailService } from '../services/email.service.js';
import { eventBus, EVENT_TYPES } from '../events/index.js';
import type { OrderConfirmedPayload, OrderReadyPayload, PaymentSuccessPayload, ShopRegisteredPayload } from '../events/index.js';

export function registerEmailHandlers(): void {
  console.log('[EmailHandler] Registering...');

  eventBus.subscribe<OrderConfirmedPayload>(EVENT_TYPES.ORDER_CONFIRMED, async (event) => {
    const order = await prisma.order.findUnique({ where: { id: event.payload.orderId }, include: { user: { select: { email: true } }, shop: { select: { businessName: true } } } });
    if (order?.user?.email) {
      await emailService.sendOrderConfirmed(order.user.email, { orderNumber: order.orderNumber, shopName: order.shop.businessName, totalCost: Number(order.totalCost) });
    }
  });

  eventBus.subscribe<OrderReadyPayload>(EVENT_TYPES.ORDER_READY, async (event) => {
    const order = await prisma.order.findUnique({ where: { id: event.payload.orderId }, include: { user: { select: { email: true } }, shop: { select: { businessName: true } } } });
    if (order?.user?.email) {
      await emailService.sendOrderReady(order.user.email, { orderNumber: order.orderNumber, shopName: order.shop.businessName });
    }
  });

  eventBus.subscribe<PaymentSuccessPayload>(EVENT_TYPES.PAYMENT_SUCCESS, async (event) => {
    const order = await prisma.order.findUnique({ where: { id: event.payload.orderId }, include: { user: { select: { email: true } } } });
    if (order?.user?.email) {
      await emailService.sendPaymentReceipt(order.user.email, { orderNumber: order.orderNumber, amount: event.payload.amount / 100, paymentId: event.payload.paymentId, date: new Date() });
    }
  });

  eventBus.subscribe<ShopRegisteredPayload>(EVENT_TYPES.SHOP_REGISTERED, async (event) => {
    const owner = await prisma.user.findUnique({ where: { id: event.payload.ownerId }, select: { email: true, name: true } });
    if (owner?.email) {
      await emailService.sendWelcome(owner.email, owner.name || event.payload.businessName);
    }
  });

  console.log('[EmailHandler] Registered');
}
