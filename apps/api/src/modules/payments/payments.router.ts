import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/errors.js";
import { resolveCompanyScope } from "../../utils/tenant-resolve.js";
import { validateBody } from "../../middleware/validate.js";
import { mpesaInitSchema, chapaInitSchema } from "./payments.schemas.js";
import * as paymentsService from "./payments.service.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/mpesa/initiate",
  requireAuth,
  validateBody(mpesaInitSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { bookingId: string; phoneNumber: string };
      const tenantId = await resolveCompanyScope(req, {
        bookingId: body.bookingId,
      });
      if (!tenantId) {
        next(
          new HttpError(400, "tenant_required", "Could not resolve operator for payment"),
        );
        return;
      }
      const out = await paymentsService.initiateMpesaPayment({
        tenantId,
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
  validateBody(chapaInitSchema),
  async (req, res, next) => {
    try {
      const body = req.body as {
        bookingId: string;
        email: string;
        firstName?: string;
        lastName?: string;
      };
      const tenantId = await resolveCompanyScope(req, {
        bookingId: body.bookingId,
      });
      if (!tenantId) {
        next(
          new HttpError(400, "tenant_required", "Could not resolve operator for payment"),
        );
        return;
      }
      const out = await paymentsService.initiateChapaPayment({
        tenantId,
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
