import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  provider: z.enum(['razorpay']).default('razorpay'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

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
  key: string;
  orderId: string;
}
