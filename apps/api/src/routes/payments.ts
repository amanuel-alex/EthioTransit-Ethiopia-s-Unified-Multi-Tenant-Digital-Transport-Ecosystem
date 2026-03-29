import { Router } from "express";
import { z } from "zod";
import {
  PaymentProvider,
  PaymentStatus,
  type PaymentInitResponse,
} from "@ethiotransit/shared";
import { initiateChapa } from "../services/chapa.js";
import { handleMpesaCallback, initiateMpesaStk } from "../services/mpesa.js";

export const paymentsRouter = Router();

const initBody = z.object({
  provider: z.nativeEnum(PaymentProvider),
  amount: z.number().positive(),
  currency: z.string().min(1),
  reference: z.string().min(1),
  description: z.string().optional(),
  customerContact: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

paymentsRouter.post("/init", async (req, res) => {
  const parsed = initBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: "validation_error",
      message: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  const body = parsed.data;
  let result: PaymentInitResponse;

  if (body.provider === PaymentProvider.MPESA) {
    const r = await initiateMpesaStk({
      phoneNumber: body.customerContact,
      amount: body.amount,
      accountReference: body.reference,
      transactionDesc: body.description ?? "EthioTransit",
    });
    if (!r.ok) {
      res.status(r.status).json({ code: r.code, message: r.message });
      return;
    }
    result = {
      provider: PaymentProvider.MPESA,
      reference: body.reference,
      status: PaymentStatus.PENDING,
      checkout: {
        merchantRequestId: r.data.merchantRequestId,
        requestId: r.data.checkoutRequestId,
      },
    };
  } else {
    const r = await initiateChapa({
      amount: String(body.amount),
      currency: body.currency,
      email: body.customerContact?.includes("@")
        ? body.customerContact
        : "customer@example.com",
      tx_ref: body.reference,
      callback_url: undefined,
      return_url: undefined,
    });
    if (!r.ok) {
      res.status(r.status).json({ code: r.code, message: r.message });
      return;
    }
    result = {
      provider: PaymentProvider.CHAPA,
      reference: body.reference,
      status: PaymentStatus.PENDING,
      checkout: { url: r.data.checkoutUrl },
    };
  }

  res.status(201).json(result);
});

paymentsRouter.post("/mpesa/callback", (req, res) => {
  const ack = handleMpesaCallback(req.body);
  res.status(200).json(ack);
});

paymentsRouter.get("/chapa/callback", (req, res) => {
  res.json({ received: true, query: req.query });
});
