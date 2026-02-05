import type { FastifyRequest, FastifyReply } from 'fastify';
import { orderService } from './order.service.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
  listOrdersQuerySchema,
} from './order.schema.js';

type AuthenticatedRequest = FastifyRequest & {
  user: NonNullable<FastifyRequest['user']>;
};

export const orderController = {
  async createOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const input = createOrderSchema.parse(request.body);
      const order = await orderService.createOrder(req.user.id, input);
      return reply.code(201).send(order);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        // Handle service area validation error
        if (error.message.startsWith('SERVICE_AREA_NOT_AVAILABLE:')) {
          const message = error.message.replace('SERVICE_AREA_NOT_AVAILABLE:', '');
          return reply.code(400).send({ 
            error: message, 
            code: 'SERVICE_AREA_NOT_AVAILABLE' 
          });
        }
        if (error.message.includes('not found') || error.message.includes('not accepting')) {
          return reply.code(400).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to create order' });
    }
  },

  async getOrderById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const params = orderIdParamSchema.parse(request.params);
      const order = await orderService.getOrderById(params.id, req.user.id);
      return reply.code(200).send(order);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Order not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to get order' });
    }
  },

  async updateOrderStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const params = orderIdParamSchema.parse(request.params);
      const input = updateOrderStatusSchema.parse(request.body);
      const order = await orderService.updateOrderStatus(params.id, input.status, req.user.id);
      return reply.code(200).send(order);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Order not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
        if (error.message.includes('Cannot transition')) {
          return reply.code(400).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update order status' });
    }
  },

  async listUserOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const query = listOrdersQuerySchema.parse(request.query);
      const result = await orderService.listUserOrders(req.user.id, query);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to list orders' });
    }
  },

  async listShopOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (req.user.role !== 'SHOP') {
        return reply.code(403).send({ error: 'Only shop owners can access this endpoint' });
      }
      const query = listOrdersQuerySchema.parse(request.query);
      const result = await orderService.listShopOrders(req.user.id, query);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to list shop orders' });
    }
  },
};
