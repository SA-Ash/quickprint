import { prisma } from '../../infrastructure/database/prisma.client.js';
import { paytmProvider } from './providers/paytm.provider.js';
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
      include: { payment: true, user: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.payment && order.payment.status === 'SUCCESS') {
      throw new Error('Order already paid');
    }

    const amountInPaise = Math.round(parseFloat(order.totalCost.toString()) * 100);

    if (provider === 'paytm') {
      const txnResult = await paytmProvider.initiateTransaction({
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
            providerOrderId: txnResult.orderId,
            status: 'PENDING',
          },
        });
      } else {
        payment = await prisma.payment.create({
          data: {
            orderId: orderId,
            amount: new Decimal(order.totalCost.toString()),
            status: 'PENDING',
            provider: 'paytm',
            providerOrderId: txnResult.orderId,
          },
        });
      }

      const config = paytmProvider.getConfig();

      return {
        paymentId: payment.id,
        providerOrderId: txnResult.orderId,
        amount: amountInPaise,
        currency: 'INR',
        key: txnResult.txnToken,
        orderId: orderId,
        mid: config.mid,
        txnToken: txnResult.txnToken,
      };
    }

    throw new Error(`Payment provider '${provider}' not supported. Use 'paytm'.`);
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentResponse> {
    const { paymentId, orderId } = input;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { userId: true } } },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.provider === 'paytm') {
      const txnStatus = await paytmProvider.verifyTransaction(orderId || payment.orderId);

      if (txnStatus.status === 'TXN_SUCCESS') {
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'SUCCESS',
            providerPayId: txnStatus.txnId,
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

        return formatPaymentResponse(updatedPayment);
      } else if (txnStatus.status === 'TXN_FAILURE') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' },
        });

        await paymentPublisher.publishPaymentFailed({
          orderId: payment.orderId,
          userId: payment.order.userId,
          reason: txnStatus.message || 'Payment failed',
        });

        throw new Error('Payment failed: ' + txnStatus.message);
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

  async handlePaytmCallback(callbackData: Record<string, string>): Promise<PaymentResponse> {
    const orderId = callbackData.ORDERID;
    const txnId = callbackData.TXNID;
    const status = callbackData.STATUS;
    const checksum = callbackData.CHECKSUMHASH;

    const isValid = paytmProvider.verifyCallbackChecksum(callbackData, checksum);
    if (!isValid) {
      throw new Error('Invalid callback checksum');
    }

    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: orderId },
      include: { order: { select: { userId: true } } },
    });

    if (!payment) {
      throw new Error('Payment not found for order');
    }

    if (status === 'TXN_SUCCESS') {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          providerPayId: txnId,
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'ACCEPTED' },
      });

      console.log(`[Paytm Callback] Payment success: ${payment.id}`);

      await paymentPublisher.publishPaymentSuccess({
        orderId: payment.orderId,
        userId: payment.order.userId,
        amount: parseFloat(payment.amount.toString()) * 100,
        paymentId: payment.id,
      });

      return formatPaymentResponse(updatedPayment);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      console.log(`[Paytm Callback] Payment failed: ${payment.id}`);

      await paymentPublisher.publishPaymentFailed({
        orderId: payment.orderId,
        userId: payment.order.userId,
        reason: callbackData.RESPMSG || 'Payment failed',
      });

      throw new Error('Payment failed: ' + callbackData.RESPMSG);
    }
  },
};
