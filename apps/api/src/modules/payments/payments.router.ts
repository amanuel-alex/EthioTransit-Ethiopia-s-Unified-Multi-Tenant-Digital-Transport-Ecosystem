import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { validateBody } from "../../middleware/validate.js";
import { mpesaInitSchema, chapaInitSchema } from "./payments.schemas.js";
import * as paymentsService from "./payments.service.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/mpesa/initiate",
  requireAuth,
  requireTenant,
  validateBody(mpesaInitSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { bookingId: string; phoneNumber: string };
      const out = await paymentsService.initiateMpesaPayment({
        tenantId: req.tenantId!,
        userId: req.user!.id,
        bookingId: body.bookingId,
        phoneNumber: body.phoneNumber,
      });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  },
);

paymentsRouter.post(
  "/chapa/initiate",
  requireAuth,
  requireTenant,
  validateBody(chapaInitSchema),
  async (req, res, next) => {
    try {
      const body = req.body as {
        bookingId: string;
        email: string;
        firstName?: string;
        lastName?: string;
      };
      const out = await paymentsService.initiateChapaPayment({
        tenantId: req.tenantId!,
        userId: req.user!.id,
        bookingId: body.bookingId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
      });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  },
);
