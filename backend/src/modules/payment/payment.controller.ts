import type { FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from './payment.service.js';
import { razorpayProvider } from './providers/razorpay.provider.js';
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
} from './payment.schema.js';

export const paymentController = {
  async initiatePayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = initiatePaymentSchema.parse(request.body);
      const result = await paymentService.initiatePayment(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Order not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message === 'Order already paid') {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to initiate payment' });
    }
  },

  async verifyPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = verifyPaymentSchema.parse(request.body);
      const result = await paymentService.verifyPayment(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Payment not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('verification failed')) {
          return reply.code(400).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to verify payment' });
    }
  },

  async getPaymentStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found' });
      }

      return reply.code(200).send(payment);
    } catch {
      return reply.code(500).send({ error: 'Failed to get payment status' });
    }
  },

  async getPaymentByOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId } = request.params;
      const payment = await paymentService.getPaymentByOrderId(orderId);

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found for order' });
      }

      return reply.code(200).send(payment);
    } catch {
      return reply.code(500).send({ error: 'Failed to get payment' });
    }
  },

  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signature = request.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(request.body);

      const isValid = await razorpayProvider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return reply.code(400).send({ error: 'Invalid webhook signature' });
      }

      const body = request.body as { event: string; payload: any };
      await paymentService.handleWebhook(body.event, body.payload);

      return reply.code(200).send({ received: true });
    } catch (error) {
      console.error('[Webhook] Error:', error);
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }
  },
};
