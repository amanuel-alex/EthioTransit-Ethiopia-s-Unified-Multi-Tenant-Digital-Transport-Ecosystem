import type { PaymentProvider, PaymentStatus } from "./payment.js";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface PaymentInitRequest {
  provider: PaymentProvider;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  /** M-Pesa: MSISDN (2547...). Chapa: customer email or phone per Chapa docs. */
  customerContact?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitResponse {
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  /** Checkout URL (Chapa) or instruction / checkoutRequestID (M-Pesa STK). */
  checkout?: {
    url?: string;
    requestId?: string;
    merchantRequestId?: string;
  };
}

export interface MpesaStkPushDto {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface ChapaInitializeDto {
  amount: string;
  currency: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tx_ref: string;
  callback_url?: string;
  return_url?: string;
  customization?: {
    title?: string;
    description?: string;
  };
}
