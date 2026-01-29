import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:statusChanged',
  NOTIFICATION_NEW: 'notification:new',
  SHOP_STATUS_CHANGED: 'shop:statusChanged',
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
} as const;

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
  private connectedUsers: Map<string, string> = new Map();

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

    this.io.on(WS_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
      console.log(`[WS] User connected: ${socket.userId} (${socket.userRole})`);

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);

        socket.join(getRoomName.user(socket.userId));

        if (socket.shopId) {
          socket.join(getRoomName.shop(socket.shopId));
        }
      }
      socket.on(WS_EVENTS.DISCONNECT, () => {
        console.log(`[WS] User disconnected: ${socket.userId}`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      socket.on(WS_EVENTS.ERROR, (error) => {
        console.error(`[WS] Socket error for user ${socket.userId}:`, error);
      });

      // Heartbeat handler - respond to client pings
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('[WS] WebSocket gateway initialized');
    return this.io;
  }

  
  getIO(): SocketIOServer | null {
    return this.io;
  }

  
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(getRoomName.user(userId)).emit(event, data);
  }

  
  emitToShop(shopId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(getRoomName.shop(shopId)).emit(event, data);
  }

  
  orderCreated(order: any): void {

    if (order.shopId) {
      this.emitToShop(order.shopId, WS_EVENTS.ORDER_CREATED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fileName: order.file?.name,
        totalCost: order.totalCost,
        createdAt: order.createdAt,
      });
    }

    if (order.userId) {
      this.emitToUser(order.userId, WS_EVENTS.ORDER_CREATED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
    }
  }

  
  orderStatusChanged(order: any, previousStatus: string): void {
    const eventData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      updatedAt: order.updatedAt,
    };

    if (order.userId) {
      this.emitToUser(order.userId, WS_EVENTS.ORDER_STATUS_CHANGED, eventData);

      this.emitToUser(order.userId, WS_EVENTS.NOTIFICATION_NEW, {
        id: `notif_${Date.now()}`,
        type: 'status_update',
        title: `Order ${order.orderNumber} Updated`,
        message: `Your order status changed to ${order.status}`,
        timestamp: new Date().toISOString(),
        orderId: order.id,
      });
    }

    if (order.shopId) {
      this.emitToShop(order.shopId, WS_EVENTS.ORDER_STATUS_CHANGED, eventData);
    }
  }

 
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

  
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }
}

export const wsGateway = new WebSocketGateway();
export default wsGateway;
