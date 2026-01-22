import { prisma } from '../../infrastructure/database/prisma.client.js';
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import type { CreateOrderInput, ListOrdersQuery } from './order.schema.js';
import { orderPublisher } from '../../events/index.js';
import { wsGateway } from '../../websocket/index.js';


function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `QP-${dateStr}-${nanoid(6).toUpperCase()}`;
}

function calculateOrderCost(
  pages: number,
  copies: number,
  isColor: boolean,
  isDoubleSided: boolean,
  pricing: { bwSingle: number; colorSingle: number; bwDouble: number; colorDouble: number }
): number {
  let pricePerPage: number;
  if (isColor) {
    pricePerPage = isDoubleSided ? pricing.colorDouble : pricing.colorSingle;
  } else {
    pricePerPage = isDoubleSided ? pricing.bwDouble : pricing.bwSingle;
  }
  return pages * copies * pricePerPage;
}

export const orderService = {
  async createOrder(userId: string, input: CreateOrderInput) {
    const shop = await prisma.shop.findUnique({
      where: { id: input.shopId },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    if (!shop.isActive) {
      throw new Error('Shop is currently not accepting orders');
    }

    const pricing = shop.pricing as { bwSingle: number; colorSingle: number; bwDouble: number; colorDouble: number };
    const totalCost = calculateOrderCost(
      input.file.pages,
      input.printConfig.copies,
      input.printConfig.color,
      input.printConfig.sides === 'double',
      pricing
    );

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        shopId: input.shopId,
        file: input.file as Prisma.InputJsonValue,
        printConfig: input.printConfig as Prisma.InputJsonValue,
        totalCost,
        status: 'PENDING',
      },
      include: {
        shop: { select: { id: true, businessName: true } },
      },
    });

    // Publish order.created event to RabbitMQ
    await orderPublisher.publishOrderCreated({
      orderId: order.id,
      userId,
      shopId: input.shopId,
      orderNumber: order.orderNumber,
    });

    // Emit real-time WebSocket event
    wsGateway.orderCreated({
      id: order.id,
      orderNumber: order.orderNumber,
      shopId: input.shopId,
      userId,
      file: input.file,
      totalCost: order.totalCost,
      createdAt: order.createdAt,
    });

    return order;
  },

  async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: { select: { id: true, businessName: true, address: true, ownerId: true } },
        user: { select: { id: true, name: true, phone: true } },
        payment: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (userId && order.userId !== userId && order.shop.ownerId !== userId) {
      throw new Error('Not authorized to view this order');
    }

    return order;
  },

  async updateOrderStatus(orderId: string, status: string, shopOwnerId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.shop.ownerId !== shopOwnerId) {
      throw new Error('Not authorized to update this order');
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PRINTING', 'CANCELLED'],
      PRINTING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as 'PENDING' | 'ACCEPTED' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED' },
      include: {
        shop: { select: { id: true, businessName: true } },
      },
    });

    // Publish status-specific events
    switch (status) {
      case 'ACCEPTED':
        await orderPublisher.publishOrderConfirmed({ orderId, userId: order.userId });
        break;
      case 'READY':
        await orderPublisher.publishOrderReady({ orderId, userId: order.userId });
        break;
      case 'COMPLETED':
        await orderPublisher.publishOrderCompleted({ orderId, totalCost: parseFloat(order.totalCost.toString()) });
        break;
      case 'CANCELLED':
        await orderPublisher.publishOrderCancelled({ orderId, reason: 'Cancelled by shop' });
        break;
    }

    // Emit real-time WebSocket event
    wsGateway.orderStatusChanged({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      shopId: updatedOrder.shopId,
      userId: order.userId,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    }, order.status);

    return updatedOrder;
  },

  async listUserOrders(userId: string, query: ListOrdersQuery) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { id: true, businessName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async listShopOrders(shopOwnerId: string, query: ListOrdersQuery) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: shopOwnerId },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { shopId: shop.id };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
