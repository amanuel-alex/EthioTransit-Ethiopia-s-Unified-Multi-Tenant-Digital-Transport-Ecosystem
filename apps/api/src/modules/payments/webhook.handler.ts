import type { NextFunction, Request, Response } from "express";
import { PaymentProvider } from "@prisma/client";
import { loadEnv } from "../../config/env.js";
import { hmacSha256Hex, safeEqual } from "../../utils/crypto.utils.js";
import { logger } from "../../utils/logger.js";
import { HttpError } from "../../utils/errors.js";
import { getClientIp, ipAllowed } from "../../utils/webhook-security.js";
import { parseMpesaStkCallback } from "./services/mpesa.service.js";
import { parseChapaWebhook } from "./services/chapa.service.js";
import * as paymentsService from "./payments.service.js";

const MPESA_SECRET_HEADER = "x-ethiotransit-mpesa-webhook-secret";

function assertMpesaWebhookAllowed(req: Request) {
  const env = loadEnv();
  if (env.WEBHOOK_INSECURE_ALLOW) return;

  if (env.MPESA_WEBHOOK_IP_ALLOWLIST?.trim()) {
    const ip = getClientIp(req);
    if (!ipAllowed(ip, env.MPESA_WEBHOOK_IP_ALLOWLIST)) {
      throw new HttpError(403, "forbidden", "M-Pesa webhook IP not allowlisted");
    }
  }

  if (env.MPESA_WEBHOOK_SECRET?.trim()) {
    const h = req.headers[MPESA_SECRET_HEADER];
    const v = Array.isArray(h) ? h[0] : h;
    if (
      typeof v !== "string" ||
      !safeEqual(v.trim(), env.MPESA_WEBHOOK_SECRET.trim())
    ) {
      throw new HttpError(401, "unauthorized", "Invalid M-Pesa webhook secret");
    }
  }
}

/**
 * Unified webhook: M-Pesa STK JSON uses Body.stkCallback; Chapa sends JSON with tx_ref/status.
 */
export async function handlePaymentsWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as unknown;
    const env = loadEnv();

    const mpesa = parseMpesaStkCallback(body);
    if (mpesa) {
      assertMpesaWebhookAllowed(req);

      if (mpesa.resultCode !== 0) {
        await paymentsService.failMpesaPaymentByCheckoutId({
          checkoutRequestId: mpesa.checkoutRequestId,
          rawPayload: body as object,
          resultCode: mpesa.resultCode,
          resultDesc: mpesa.resultDesc,
        });
        res.json({
          ResultCode: 0,
          ResultDesc: "received",
          note: "payment_failed_or_cancelled",
        });
        return;
      }

      try {
        await paymentsService.confirmPaymentByProvider({
          externalRef: mpesa.checkoutRequestId,
          provider: PaymentProvider.MPESA,
          mpesaReceipt: mpesa.mpesaReceipt,
          paidAmount: mpesa.amount,
          rawPayload: body as object,
        });
      } catch (e) {
        if (e instanceof HttpError) {
          logger.warn(
            { err: e, checkoutRequestId: mpesa.checkoutRequestId },
            "mpesa_confirm_rejected",
          );
          res.json({
            ResultCode: 0,
            ResultDesc: "received",
            note: "confirm_rejected",
            code: e.code,
          });
          return;
        }
        throw e;
      }

      res.json({ ResultCode: 0, ResultDesc: "accepted" });
      return;
    }

    if (env.CHAPA_WEBHOOKS_DISABLED) {
      res.status(403).json({
        code: "chapa_disabled",
        message: "Chapa webhooks are disabled for this deployment",
      });
      return;
    }

    const raw =
      req.rawBody instanceof Buffer
        ? req.rawBody.toString("utf8")
        : JSON.stringify(body ?? {});

    const sigHeader =
      req.headers["chapa-signature"] ??
      req.headers["x-chapa-signature"] ??
      req.headers["x-signature"];
    const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

    if (env.CHAPA_WEBHOOK_SECRET?.trim()) {
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
    } else if (env.NODE_ENV === "production" && !env.WEBHOOK_INSECURE_ALLOW) {
      res.status(503).json({
        code: "misconfigured",
        message: "CHAPA_WEBHOOK_SECRET is required to verify Chapa webhooks",
      });
      return;
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

    try {
      await paymentsService.confirmPaymentByProvider({
        paymentId: ch.txRef,
        provider: PaymentProvider.CHAPA,
        paidAmount: ch.amount != null ? Number(ch.amount) : undefined,
        rawPayload: body as object,
      });
    } catch (e) {
      if (e instanceof HttpError) {
        logger.warn({ err: e, txRef: ch.txRef }, "chapa_confirm_rejected");
        res.status(200).json({ received: true, note: "confirm_rejected", code: e.code });
        return;
      }
      throw e;
    }

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
