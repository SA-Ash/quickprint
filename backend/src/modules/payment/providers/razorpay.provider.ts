import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../../config/env.js';

interface OrderParams {
  orderId: string;
  amount: number; // in paise
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface RazorpayOrder {
  razorpayOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface PaymentVerification {
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  message: string;
}

function getRazorpayInstance(): Razorpay | null {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export const razorpayProvider = {
  async createOrder(params: OrderParams): Promise<RazorpayOrder> {
    const razorpay = getRazorpayInstance();

    if (!razorpay || env.NODE_ENV === 'development') {
      return this.mockCreateOrder(params);
    }

    try {
      const order = await razorpay.orders.create({
        amount: params.amount, // amount in paise
        currency: 'INR',
        receipt: params.orderId,
        notes: {
          customerId: params.customerId,
          customerEmail: params.customerEmail || '',
          customerPhone: params.customerPhone || '',
        },
      });

      console.log(`[RAZORPAY] Order created: ${order.id} for ${params.orderId}`);

      return {
        razorpayOrderId: order.id,
        orderId: params.orderId,
        amount: params.amount,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID!,
      };
    } catch (error) {
      console.error('[RAZORPAY] Failed to create order:', error);
      throw new Error('Failed to create Razorpay order');
    }
  },

  mockCreateOrder(params: OrderParams): RazorpayOrder {
    console.log(`[MOCK RAZORPAY] Creating order: ${params.orderId}, Amount: ₹${params.amount / 100}`);
    
    return {
      razorpayOrderId: 'order_mock_' + Date.now(),
      orderId: params.orderId,
      amount: params.amount,
      currency: 'INR',
      keyId: 'rzp_test_mock',
    };
  },

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentVerification> {
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (!keySecret || env.NODE_ENV === 'development') {
      return this.mockVerifyPayment(razorpayOrderId, razorpayPaymentId);
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('[RAZORPAY] Signature verification failed');
      return {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        status: 'failed',
        amount: 0,
        message: 'Payment signature verification failed',
      };
    }

    console.log(`[RAZORPAY] Payment verified: ${razorpayPaymentId}`);

    // Fetch payment details
    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const payment = await razorpay.payments.fetch(razorpayPaymentId);
        return {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          status: payment.status === 'captured' ? 'success' : 
                  payment.status === 'failed' ? 'failed' : 'pending',
          amount: payment.amount as number,
          message: 'Payment verified successfully',
        };
      } catch (error) {
        console.error('[RAZORPAY] Failed to fetch payment:', error);
      }
    }

    return {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      status: 'success',
      amount: 0,
      message: 'Payment verified via signature',
    };
  },

  mockVerifyPayment(razorpayOrderId: string, razorpayPaymentId: string): PaymentVerification {
    console.log(`[MOCK RAZORPAY] Verifying payment: ${razorpayPaymentId} - AUTO SUCCESS`);
    
    return {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      status: 'success',
      amount: 0,
      message: 'Payment successful (mock)',
    };
  },

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret || env.NODE_ENV === 'development') {
      console.log('[MOCK RAZORPAY] Webhook signature verified (mock)');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  },

  getConfig() {
    return {
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      isProduction: env.NODE_ENV === 'production',
    };
  },
};
