import type { FastifyInstance } from 'fastify';
import { paymentController } from './payment.controller.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post('/initiate', paymentController.initiatePayment);
  fastify.post('/verify', paymentController.verifyPayment);
  fastify.get('/:id/status', paymentController.getPaymentStatus);
  fastify.get('/order/:orderId', paymentController.getPaymentByOrder);
  fastify.post('/webhook', paymentController.handleWebhook);
}
