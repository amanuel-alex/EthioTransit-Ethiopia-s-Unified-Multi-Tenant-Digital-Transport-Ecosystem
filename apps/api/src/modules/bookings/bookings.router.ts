import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { validateBody } from "../../middleware/validate.js";
import { cancelBookingSchema, createBookingSchema } from "./bookings.schemas.js";
import * as bookingsService from "./bookings.service.js";

export const bookingsRouter = Router();

bookingsRouter.post(
  "/create",
  requireAuth,
  requireTenant,
  validateBody(createBookingSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { scheduleId: string; seats: number[] };
      const booking = await bookingsService.createBooking({
        tenantId: req.tenantId!,
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
  requireTenant,
  validateBody(cancelBookingSchema),
  async (req, res, next) => {
    try {
      const body = req.body as { bookingId: string };
      const out = await bookingsService.cancelBooking({
        tenantId: req.tenantId!,
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
  requireTenant,
  async (req, res, next) => {
    try {
      const rows = await bookingsService.listForUser(
        req.tenantId!,
        req.user!.id,
      );
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
  async (req, res, next) => {
    try {
      const rows = await bookingsService.listForCompany(req.tenantId!);
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);
