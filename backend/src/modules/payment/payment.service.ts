import { prisma } from '../../infrastructure/database/prisma.client.js';
import { razorpayProvider } from './providers/razorpay.provider.js';
import type {
  InitiatePaymentInput,
  VerifyPaymentInput,
  PaymentResponse,
  InitiatePaymentResponse,
} from './payment.schema.js';
import { Decimal } from '@prisma/client/runtime/library';
import { paymentPublisher } from '../../events/index.js';

function formatPaymentResponse(payment: any): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: parseFloat(payment.amount.toString()),
    status: payment.status,
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    providerPayId: payment.providerPayId,
    createdAt: payment.createdAt,
  };
}

export const paymentService = {
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResponse> {
    const { orderId, provider } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.payment && order.payment.status === 'SUCCESS') {
      throw new Error('Order already paid');
    }

    const amountInPaise = Math.round(parseFloat(order.totalCost.toString()) * 100);

    if (provider === 'razorpay') {
      const razorpayOrder = await razorpayProvider.createOrder({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId: orderId,
          orderNumber: order.orderNumber,
        },
      });

      let payment = order.payment;
      if (payment) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            providerOrderId: razorpayOrder.id,
            status: 'PENDING',
          },
        });
      } else {
        payment = await prisma.payment.create({
          data: {
            orderId: orderId,
            amount: new Decimal(order.totalCost.toString()),
            status: 'PENDING',
            provider: 'razorpay',
            providerOrderId: razorpayOrder.id,
          },
        });
      }

      return {
        paymentId: payment.id,
        providerOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        key: razorpayProvider.getKeyId(),
        orderId: orderId,
      };
    }

    throw new Error(`Payment provider '${provider}' not supported`);
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentResponse> {
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.provider === 'razorpay') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing Razorpay verification parameters');
      }

      const isValid = await razorpayProvider.verifySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' },
        });
        
        // Publish payment.failed event
        await paymentPublisher.publishPaymentFailed({
          orderId: payment.orderId,
          reason: 'Payment signature verification failed',
        });
        
        throw new Error('Payment signature verification failed');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          providerPayId: razorpay_payment_id,
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'ACCEPTED' },
      });

      console.log(`[Payment] Verified: ${paymentId}, Order: ${payment.orderId}`);

      // Publish payment.success event
      await paymentPublisher.publishPaymentSuccess({
        orderId: payment.orderId,
        amount: parseFloat(updatedPayment.amount.toString()) * 100,
        paymentId: updatedPayment.id,
      });

      return formatPaymentResponse(updatedPayment);
    }

    throw new Error('Unknown payment provider');
  },

  async getPaymentById(paymentId: string): Promise<PaymentResponse | null> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return null;
    return formatPaymentResponse(payment);
  },

  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse | null> {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) return null;
    return formatPaymentResponse(payment);
  },

  async handleWebhook(event: string, payload: any): Promise<void> {
    console.log(`[Webhook] Event: ${event}`);

    if (event === 'payment.captured') {
      const razorpayPaymentId = payload.payment?.entity?.id;
      const razorpayOrderId = payload.payment?.entity?.order_id;

      if (razorpayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: razorpayOrderId },
        });

        if (payment && payment.status !== 'SUCCESS') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              providerPayId: razorpayPaymentId,
            },
          });

          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'ACCEPTED' },
          });

          console.log(`[Webhook] Payment success: ${payment.id}`);
          
          // Publish payment.success event
          await paymentPublisher.publishPaymentSuccess({
            orderId: payment.orderId,
            amount: parseFloat(payment.amount.toString()) * 100,
            paymentId: payment.id,
          });
        }
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = payload.payment?.entity?.order_id;

      if (razorpayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: razorpayOrderId },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });

          console.log(`[Webhook] Payment failed: ${payment.id}`);
          
          // Publish payment.failed event
          await paymentPublisher.publishPaymentFailed({
            orderId: payment.orderId,
            reason: 'Payment failed via webhook',
          });
        }
      }
    }
  },
};
