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
import { emailNotificationService } from '../notification/email.notification.service.js';

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
      include: { payment: true, user: true },
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
        orderId: orderId,
        amount: amountInPaise,
        customerId: order.userId,
        customerEmail: order.user.email || undefined,
        customerPhone: order.user.phone,
      });

      let payment = order.payment;
      if (payment) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            providerOrderId: razorpayOrder.razorpayOrderId,
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
            providerOrderId: razorpayOrder.razorpayOrderId,
          },
        });
      }

      const config = razorpayProvider.getConfig();

      return {
        paymentId: payment.id,
        providerOrderId: razorpayOrder.razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key: config.keyId,
        orderId: orderId,
      };
    }

    throw new Error(`Payment provider '${provider}' not supported. Use 'razorpay'.`);
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentResponse> {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { userId: true } } },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.provider === 'razorpay') {
      const verification = await razorpayProvider.verifyPayment(
        razorpayOrderId || payment.providerOrderId || '',
        razorpayPaymentId || '',
        razorpaySignature || ''
      );

      if (verification.status === 'success') {
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'SUCCESS',
            providerPayId: razorpayPaymentId,
          },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'ACCEPTED' },
        });

        console.log(`[Payment] Verified: ${paymentId}, Order: ${payment.orderId}`);

        await paymentPublisher.publishPaymentSuccess({
          orderId: payment.orderId,
          userId: payment.order.userId,
          amount: parseFloat(updatedPayment.amount.toString()) * 100,
          paymentId: updatedPayment.id,
        });

        // Send payment confirmation email (async, don't block)
        const orderData = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { user: { select: { email: true, name: true } } },
        });
        if (orderData?.user?.email) {
          emailNotificationService.sendPaymentConfirmationEmail(
            orderData.user.email,
            orderData.user.name,
            orderData.orderNumber,
            parseFloat(updatedPayment.amount.toString()),
            updatedPayment.id
          ).catch(err => console.error('[Email] Payment confirmation failed:', err));
        }

        return formatPaymentResponse(updatedPayment);
      } else if (verification.status === 'failed') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' },
        });

        await paymentPublisher.publishPaymentFailed({
          orderId: payment.orderId,
          userId: payment.order.userId,
          reason: verification.message || 'Payment failed',
        });

        throw new Error('Payment failed: ' + verification.message);
      } else {
        throw new Error('Payment pending verification');
      }
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

  async handleRazorpayWebhook(payload: string, signature: string): Promise<PaymentResponse | null> {
    const isValid = razorpayProvider.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);
    const eventType = event.event;

    if (eventType === 'payment.captured') {
      const paymentData = event.payload.payment.entity;
      const razorpayOrderId = paymentData.order_id;
      const razorpayPaymentId = paymentData.id;
      const amount = paymentData.amount;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: razorpayOrderId },
        include: { order: { select: { userId: true } } },
      });

      if (!payment) {
        console.error(`[Razorpay Webhook] Payment not found for order: ${razorpayOrderId}`);
        return null;
      }

      const updatedPayment = await prisma.payment.update({
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

      console.log(`[Razorpay Webhook] Payment success: ${payment.id}`);

      await paymentPublisher.publishPaymentSuccess({
        orderId: payment.orderId,
        userId: payment.order.userId,
        amount: amount,
        paymentId: payment.id,
      });

      // Send payment confirmation email (async, don't block)
      const orderData = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { user: { select: { email: true, name: true } } },
      });
      if (orderData?.user?.email) {
        emailNotificationService.sendPaymentConfirmationEmail(
          orderData.user.email,
          orderData.user.name,
          orderData.orderNumber,
          parseFloat(updatedPayment.amount.toString()),
          updatedPayment.id
        ).catch(err => console.error('[Email] Payment confirmation failed:', err));
      }

      return formatPaymentResponse(updatedPayment);
    }

    if (eventType === 'payment.failed') {
      const paymentData = event.payload.payment.entity;
      const razorpayOrderId = paymentData.order_id;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: razorpayOrderId },
        include: { order: { select: { userId: true } } },
      });

      if (!payment) {
        console.error(`[Razorpay Webhook] Payment not found for order: ${razorpayOrderId}`);
        return null;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      console.log(`[Razorpay Webhook] Payment failed: ${payment.id}`);

      await paymentPublisher.publishPaymentFailed({
        orderId: payment.orderId,
        userId: payment.order.userId,
        reason: paymentData.error_description || 'Payment failed',
      });

      return formatPaymentResponse(payment);
    }

    return null;
  },
};
