/**
 * WebSocket Gateway
 * Handles real-time communication using Socket.io
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Event types for real-time updates
export const WS_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:statusChanged',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',

  // Shop events
  SHOP_STATUS_CHANGED: 'shop:statusChanged',

  // Payment events
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
} as const;

// Room naming conventions
export const getRoomName = {
  user: (userId: string) => `user:${userId}`,
  shop: (shopId: string) => `shop:${shopId}`,
  order: (orderId: string) => `order:${orderId}`,
};

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  shopId?: string;
}

class WebSocketGateway {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.NODE_ENV === 'development'
          ? ['http://localhost:5173', 'http://localhost:3000']
          : ['https://quickprint.com', 'https://www.quickprint.com'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string; shopId?: string };
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        socket.shopId = decoded.shopId;

        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on(WS_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
      console.log(`[WS] User connected: ${socket.userId} (${socket.userRole})`);

      // Track connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);

        // Join user's personal room
        socket.join(getRoomName.user(socket.userId));

        // If shop owner, join shop room
        if (socket.shopId) {
          socket.join(getRoomName.shop(socket.shopId));
        }
      }

      // Handle disconnection
      socket.on(WS_EVENTS.DISCONNECT, () => {
        console.log(`[WS] User disconnected: ${socket.userId}`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on(WS_EVENTS.ERROR, (error) => {
        console.error(`[WS] Socket error for user ${socket.userId}:`, error);
      });
    });

    console.log('[WS] WebSocket gateway initialized');
    return this.io;
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(getRoomName.user(userId)).emit(event, data);
  }

  /**
   * Emit event to a specific shop
   */
  emitToShop(shopId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(getRoomName.shop(shopId)).emit(event, data);
  }

  /**
   * Emit order created event
   */
  orderCreated(order: any): void {
    // Notify the shop owner
    if (order.shopId) {
      this.emitToShop(order.shopId, WS_EVENTS.ORDER_CREATED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fileName: order.file?.name,
        totalCost: order.totalCost,
        createdAt: order.createdAt,
      });
    }

    // Notify the customer
    if (order.userId) {
      this.emitToUser(order.userId, WS_EVENTS.ORDER_CREATED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
    }
  }

  /**
   * Emit order status changed event
   */
  orderStatusChanged(order: any, previousStatus: string): void {
    const eventData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      updatedAt: order.updatedAt,
    };

    // Notify customer
    if (order.userId) {
      this.emitToUser(order.userId, WS_EVENTS.ORDER_STATUS_CHANGED, eventData);

      // Also send as notification
      this.emitToUser(order.userId, WS_EVENTS.NOTIFICATION_NEW, {
        id: `notif_${Date.now()}`,
        type: 'status_update',
        title: `Order ${order.orderNumber} Updated`,
        message: `Your order status changed to ${order.status}`,
        timestamp: new Date().toISOString(),
        orderId: order.id,
      });
    }

    // Notify shop
    if (order.shopId) {
      this.emitToShop(order.shopId, WS_EVENTS.ORDER_STATUS_CHANGED, eventData);
    }
  }

  /**
   * Emit payment completed event
   */
  paymentCompleted(payment: any): void {
    if (payment.userId) {
      this.emitToUser(payment.userId, WS_EVENTS.PAYMENT_COMPLETED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });
    }

    if (payment.shopId) {
      this.emitToShop(payment.shopId, WS_EVENTS.PAYMENT_COMPLETED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
export const wsGateway = new WebSocketGateway();
export default wsGateway;
