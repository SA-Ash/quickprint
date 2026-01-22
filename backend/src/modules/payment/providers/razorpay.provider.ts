import { env } from '../../../config/env.js';

interface CreateOrderParams {
  amount: number; // in smallest currency unit (paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

interface VerifySignatureParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const razorpayProvider = {
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    if (env.NODE_ENV === 'development' && !env.RAZORPAY_KEY_ID) {
      return this.mockCreateOrder(params);
    }
    return this.realCreateOrder(params);
  },

  async mockCreateOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    console.log(`[MOCK RAZORPAY] Creating order: ${params.receipt}, Amount: ${params.amount}`);
    
    return {
      id: 'order_mock_' + Date.now(),
      entity: 'order',
      amount: params.amount,
      amount_paid: 0,
      amount_due: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      status: 'created',
    };
  },

  async realCreateOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    const Razorpay = (await import('razorpay')).default;
    
    const instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });

    console.log(`[RAZORPAY] Order created: ${order.id}`);
    return order as RazorpayOrder;
  },

  async verifySignature(params: VerifySignatureParams): Promise<boolean> {
    if (env.NODE_ENV === 'development' && !env.RAZORPAY_KEY_SECRET) {
      console.log('[MOCK RAZORPAY] Signature verification bypassed');
      return true;
    }

    const crypto = await import('crypto');
    
    const body = params.razorpay_order_id + '|' + params.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === params.razorpay_signature;
    console.log(`[RAZORPAY] Signature verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    return isValid;
  },

  async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    if (env.NODE_ENV === 'development' && !env.RAZORPAY_WEBHOOK_SECRET) {
      console.log('[MOCK RAZORPAY] Webhook signature verification bypassed');
      return true;
    }

    const crypto = await import('crypto');
    
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  },

  getKeyId(): string {
    return env.RAZORPAY_KEY_ID || 'rzp_test_mock';
  },
};
