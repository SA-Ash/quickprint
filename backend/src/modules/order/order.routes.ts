import type { FastifyInstance } from 'fastify';
import { orderController } from './order.controller.js';

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.post('/', orderController.createOrder);
  fastify.get('/', orderController.listUserOrders);
  fastify.get('/shop', orderController.listShopOrders);
  fastify.get('/:id', orderController.getOrderById);
  fastify.patch('/:id/status', orderController.updateOrderStatus);
}
