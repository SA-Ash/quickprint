import { nanoid } from 'nanoid';

interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface MockOrder {
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
  async createOrder(params: CreateOrderParams): Promise<MockOrder> {
    console.log(`[MOCK PAYMENT] Creating order: ${params.receipt}, Amount: ₹${params.amount / 100}`);

    return {
      id: 'order_' + nanoid(16),
      entity: 'order',
      amount: params.amount,
      amount_paid: 0,
      amount_due: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      status: 'created',
    };
  },

  async verifySignature(_params: VerifySignatureParams): Promise<boolean> {
    console.log('[MOCK PAYMENT] Payment signature verified (mock)');
    return true;
  },

  async verifyWebhookSignature(_body: string, _signature: string): Promise<boolean> {
    console.log('[MOCK PAYMENT] Webhook signature verified (mock)');
    return true;
  },

  getKeyId(): string {
    return 'mock_key_id';
  },
};
