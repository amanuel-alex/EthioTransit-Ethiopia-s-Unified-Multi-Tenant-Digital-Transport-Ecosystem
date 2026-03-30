import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { pickHeaderCompany, requireTenant } from "../../middleware/tenant.js";
import { HttpError } from "../../utils/errors.js";
import { resolveCompanyScope } from "../../utils/tenant-resolve.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { cancelBookingSchema, createBookingSchema } from "./bookings.schemas.js";
import * as bookingsService from "./bookings.service.js";
import type { z } from "zod";
import { companyBookingsQuerySchema } from "../company/operator.schemas.js";

export const bookingsRouter = Router();

bookingsRouter.post(
  "/create",
  requireAuth,
  validateBody(createBookingSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { scheduleId: string; seats: number[] };
      const tenantId = await resolveCompanyScope(req, {
        scheduleId: body.scheduleId,
      });
      if (!tenantId) {
        next(
          new HttpError(400, "tenant_required", "Could not resolve operator for this trip"),
        );
        return;
      }
      const booking = await bookingsService.createBooking({
        tenantId,
        userId: req.user!.id,
        scheduleId: body.scheduleId,
        seats: body.seats,
      });
      res.status(201).json({
        booking: {
          id: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount.toString(),
          platformFee: booking.platformFee.toString(),
          companyEarning: booking.companyEarning.toString(),
          seats: booking.seats.map((s) => s.seatNo),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

bookingsRouter.post(
  "/cancel",
  requireAuth,
  validateBody(cancelBookingSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { bookingId: string };
      const tenantId = await resolveCompanyScope(req, {
        bookingId: body.bookingId,
      });
      if (!tenantId) {
        next(
          new HttpError(400, "tenant_required", "Could not resolve operator for this booking"),
        );
        return;
      }
      const out = await bookingsService.cancelBooking({
        tenantId,
        userId: req.user!.id,
        bookingId: body.bookingId,
      });
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
);

bookingsRouter.get(
  "/user",
  requireAuth,
  async (req, res, next) => {
    try {
      if (req.user!.role === UserRole.PASSENGER && !pickHeaderCompany(req)) {
        const rows = await bookingsService.listForUserAll(req.user!.id);
        res.json({ data: rows });
        return;
      }
      const tenantId = await resolveCompanyScope(req, {});
      if (!tenantId) {
        next(new HttpError(400, "tenant_required", "Missing tenant context"));
        return;
      }
      const rows = await bookingsService.listForUser(tenantId, req.user!.id);
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);

bookingsRouter.get(
  "/company",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateQuery(companyBookingsQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.validatedQuery as z.infer<typeof companyBookingsQuerySchema>;
      const rows = await bookingsService.listForCompanyFiltered(
        req.tenantId!,
        {
          from: q.from ? new Date(q.from) : undefined,
          to: q.to ? new Date(q.to) : undefined,
          routeId: q.routeId,
          status: q.status,
        },
      );
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);
