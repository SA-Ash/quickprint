import { prisma } from '../../infrastructure/database/prisma.client.js';
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import type { CreateOrderInput, ListOrdersQuery } from './order.schema.js';
import { orderPublisher } from '../../events/index.js';
import { wsGateway } from '../../websocket/index.js';
import { emailNotificationService } from '../notification/email.notification.service.js';


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

    // Validate service area - check if shop serves the user's area
    // The shop was already shown to the user via getNearbyShops (distance-based),
    // but we do a secondary check here for safety.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const serviceAreas = (shop.serviceAreas as Array<{ name: string; lat?: number; lng?: number; active?: boolean }>) || [];
    const activeAreas = serviceAreas.filter(a => a.active !== false);
    
    if (activeAreas.length > 0 && user) {
      let servesUser = false;
      
      // Check 1: Name-based match (user's college vs service area name)
      if (user.college) {
        const userCollegeLower = user.college.toLowerCase().trim();
        servesUser = activeAreas.some(area => {
          const areaNameLower = area.name.toLowerCase().trim();
          return areaNameLower.includes(userCollegeLower) || 
                 userCollegeLower.includes(areaNameLower);
        });
      }
      
      // Check 2: If service areas have coordinates, the shop serves a geographic area
      // The shop was already shown via getNearbyShops which filters by distance,
      // so if any service area has coords, trust the discovery-layer filtering
      if (!servesUser) {
        const hasGeoAreas = activeAreas.some(area => 
          typeof area.lat === 'number' && typeof area.lng === 'number'
        );
        if (hasGeoAreas) {
          // Shop has coordinate-based service areas - trust the discovery layer
          servesUser = true;
        }
      }

      // Only block if shop has ONLY name-based areas and none match the user
      if (!servesUser) {
        console.log(`[Order Service] Service area check failed for user ${userId} (college: ${user.college}) - shop areas:`, JSON.stringify(activeAreas));
        throw new Error('SERVICE_AREA_NOT_AVAILABLE:This shop is not delivering to your area. Please select a different shop.');
      }
    }

    // Use totalCost from frontend (includes platform fees, GST, etc.)
    // Falls back to calculating base cost if totalCost not provided
    const pricing = shop.pricing as { bwSingle: number; colorSingle: number; bwDouble: number; colorDouble: number };
    const baseCost = calculateOrderCost(
      input.file.pages,
      input.printConfig.copies,
      input.printConfig.color,
      input.printConfig.sides === 'double',
      pricing
    );
    
    // Use frontend totalCost if provided, otherwise use calculated base cost
    const totalCost = input.totalCost || baseCost;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        shopId: input.shopId,
        file: input.file as Prisma.InputJsonValue,
        printConfig: input.printConfig as Prisma.InputJsonValue,
        totalCost,
        status: 'PENDING',
        paymentMethod: input.paymentMethod || 'cod',
        paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'pending',
      },
      include: {
        shop: { select: { id: true, businessName: true } },
      },
    });

    await orderPublisher.publishOrderCreated({
      orderId: order.id,
      userId,
      shopId: input.shopId,
      orderNumber: order.orderNumber,
    });

    wsGateway.orderCreated({
      id: order.id,
      orderNumber: order.orderNumber,
      shopId: input.shopId,
      userId,
      file: input.file,
      totalCost: order.totalCost,
      createdAt: order.createdAt,
    });

    // Send order created email notification (async, don't block)
    if (user?.email) {
      const fileData = input.file as { name?: string; pages?: number };
      emailNotificationService.sendOrderCreatedEmail(
        user.email,
        user.name,
        {
          orderNumber: order.orderNumber,
          fileName: fileData.name || 'Document',
          copies: input.printConfig.copies,
          pages: fileData.pages || 1,
          colorType: input.printConfig.color ? 'Color' : 'Black & White',
          sides: input.printConfig.sides === 'double' ? 'Double-Sided' : 'Single-Sided',
          totalCost: parseFloat(order.totalCost.toString()),
          shopName: order.shop.businessName,
        }
      ).catch(err => console.error('[Email] Order created notification failed:', err));
    }

    return order;
  },

  async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: { 
          include: {
            owner: { select: { id: true, phone: true } }, // Include owner for their phone
          },
        },
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

    // Simplified state machine:
    // PENDING → ACCEPTED (= "Processing") → READY → COMPLETED
    // CANCELLED can be reached from PENDING, ACCEPTED, or READY
    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['READY', 'CANCELLED'],  // Skip PRINTING - ACCEPTED is "Processing"
      PRINTING: ['READY', 'CANCELLED'],  // Keep for backwards compatibility
      READY: ['COMPLETED', 'CANCELLED'],
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
        await orderPublisher.publishOrderCancelled({ orderId, userId: order.userId, reason: 'Cancelled by shop' });
        break;
    }

    wsGateway.orderStatusChanged({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      shopId: updatedOrder.shopId,
      userId: order.userId,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    }, order.status);

    // Send email notification for status change (async, don't block)
    const userData = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, name: true },
    });
    if (userData?.email) {
      emailNotificationService.sendOrderStatusEmail(
        userData.email,
        userData.name,
        updatedOrder.orderNumber,
        status,
        updatedOrder.shop.businessName
      ).catch(err => console.error('[Email] Status update notification failed:', err));
    }

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
          shop: { 
            include: {
              owner: { select: { id: true, phone: true } },
            },
          },
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
          user: { select: { id: true, name: true, phone: true, college: true } },
          payment: { select: { id: true, status: true, createdAt: true } },
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
