import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  provider: z.enum(['razorpay', 'cashfree']).default('razorpay'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        status: z.string(),
        amount: z.number(),
      }),
    }).optional(),
    order: z.object({
      entity: z.object({
        id: z.string(),
        status: z.string(),
      }),
    }).optional(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  provider: string;
  providerOrderId: string | null;
  providerPayId: string | null;
  createdAt: Date;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  key?: string; 
  orderId: string;
}
