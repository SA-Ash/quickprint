import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  provider: z.enum(['paytm']).default('paytm'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const paytmCallbackSchema = z.record(z.string());

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
  mid?: string;
  txnToken?: string;
}
