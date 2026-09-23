import { z } from 'zod';

import type { CurrencyCode } from '../money';

export const PaymentOrderRequestSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  token: z.string().optional()
});

export type PaymentOrderRequestInput = z.infer<typeof PaymentOrderRequestSchema>;

export const PaymentVerificationSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  amountMinor: z.number().int().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional()
});

export type PaymentVerificationInput = z.infer<typeof PaymentVerificationSchema>;

export interface RazorpayOrderInput {
  amountMinor: number;
  currency: CurrencyCode;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amountMinor: number;
  currency: CurrencyCode;
  receipt: string;
  status: string;
}

export interface RazorpayClientConfig {
  keyId: string;
  keySecret: string;
}

export interface RazorpayPaymentModalOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export const RazorpayWebhookEventSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string(),
  event: z.enum([
    'payment.authorized',
    'payment.captured',
    'payment.failed',
    'order.paid',
    'refund.created',
    'refund.processed'
  ]),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string(),
          order_id: z.string().nullable().optional(),
          amount: z.number(),
          currency: z.string(),
          status: z.string(),
          error_code: z.string().nullable().optional(),
          error_description: z.string().nullable().optional()
        })
      })
      .optional(),
    order: z
      .object({
        entity: z.object({
          id: z.string(),
          amount: z.number(),
          amount_paid: z.number(),
          currency: z.string(),
          receipt: z.string().nullable().optional(),
          status: z.string()
        })
      })
      .optional()
  }),
  created_at: z.number()
});

export type RazorpayWebhookEvent = z.infer<typeof RazorpayWebhookEventSchema>;
