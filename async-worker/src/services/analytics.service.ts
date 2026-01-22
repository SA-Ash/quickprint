/**
 * Analytics Service
 */

import { prisma } from '../infrastructure/database/prisma.client.js';

const store = {
  orderEvents: [] as any[],
  paymentEvents: [] as any[],
  shopEvents: [] as any[],
};

export const analyticsService = {
  async logOrderEvent(event: string, data: any) {
    store.orderEvents.push({ event, data, timestamp: new Date() });
    console.log(`[Analytics] Order: ${event}`, data);
  },

  async logPaymentEvent(event: string, data: any) {
    store.paymentEvents.push({ event, data, timestamp: new Date() });
    console.log(`[Analytics] Payment: ${event}`, data);
  },

  async logShopEvent(event: string, data: any) {
    store.shopEvents.push({ event, data, timestamp: new Date() });
    console.log(`[Analytics] Shop: ${event}`, data);
  },

  async getOrderStats() {
    const orders = await prisma.order.findMany({ select: { status: true } });
    const byStatus: Record<string, number> = {};
    orders.forEach((o) => (byStatus[o.status] = (byStatus[o.status] || 0) + 1));
    return { totalOrders: orders.length, ordersByStatus: byStatus };
  },

  async getRevenueStats() {
    const payments = await prisma.payment.findMany({ where: { status: 'SUCCESS' }, select: { amount: true } });
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { totalRevenue: total, averageOrderValue: payments.length ? total / payments.length : 0 };
  },
};
