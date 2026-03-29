import type { NextFunction, Request, Response } from "express";
import { PaymentProvider } from "@prisma/client";
import { loadEnv } from "../../config/env.js";
import { hmacSha256Hex, safeEqual } from "../../utils/crypto.utils.js";
import { logger } from "../../utils/logger.js";
import { HttpError } from "../../utils/errors.js";
import { parseMpesaStkCallback } from "./services/mpesa.service.js";
import { parseChapaWebhook } from "./services/chapa.service.js";
import * as paymentsService from "./payments.service.js";

/**
 * Unified webhook: M-Pesa STK JSON uses Body.stkCallback; Chapa sends JSON with tx_ref/status.
 * Register Daraja callback URL to POST /api/v1/payments/webhook (same path).
 */
export async function handlePaymentsWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as unknown;

    const mpesa = parseMpesaStkCallback(body);
    if (mpesa) {
      if (mpesa.resultCode !== 0) {
        res.json({
          ResultCode: 0,
          ResultDesc: "received",
          note: "payment_failed_or_cancelled",
        });
        return;
      }
      await paymentsService.confirmPaymentByProvider({
        externalRef: mpesa.checkoutRequestId,
        provider: PaymentProvider.MPESA,
        mpesaReceipt: mpesa.mpesaReceipt,
        paidAmount: mpesa.amount,
        rawPayload: body as object,
      });
      res.json({ ResultCode: 0, ResultDesc: "accepted" });
      return;
    }

    const env = loadEnv();
    const raw =
      req.rawBody instanceof Buffer
        ? req.rawBody.toString("utf8")
        : JSON.stringify(body ?? {});

    const sigHeader =
      req.headers["chapa-signature"] ??
      req.headers["x-chapa-signature"] ??
      req.headers["x-signature"];
    const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

    if (env.CHAPA_WEBHOOK_SECRET) {
      if (!sig || typeof sig !== "string") {
        res.status(401).json({ code: "invalid_signature", message: "Missing signature" });
        return;
      }
      const expectedHex = hmacSha256Hex(env.CHAPA_WEBHOOK_SECRET, raw);
      const a = sig.trim();
      const b = expectedHex;
      const ok =
        safeEqual(a, b) ||
        safeEqual(a, `sha256=${b}`) ||
        safeEqual(a, `v1=${b}`);
      if (!ok) {
        res.status(401).json({ code: "invalid_signature", message: "Bad signature" });
        return;
      }
    }

    const ch = parseChapaWebhook(body);
    const st = ch.status?.toLowerCase() ?? "";
    const paid =
      st === "success" ||
      st === "successful" ||
      st === "completed" ||
      st === "paid";

    if (!ch.txRef) {
      res.json({ received: true });
      return;
    }

    if (!paid) {
      res.json({ received: true, status: ch.status });
      return;
    }

    await paymentsService.confirmPaymentByProvider({
      paymentId: ch.txRef,
      provider: PaymentProvider.CHAPA,
      paidAmount: ch.amount != null ? Number(ch.amount) : undefined,
      rawPayload: body as object,
    });

    res.json({ ok: true });
  } catch (e) {
    if (e instanceof HttpError) {
      logger.warn({ err: e }, "webhook_business_error");
      res.status(e.status).json({ code: e.code, message: e.message });
      return;
    }
    logger.error({ err: e }, "webhook_error");
    next(e);
  }
}
