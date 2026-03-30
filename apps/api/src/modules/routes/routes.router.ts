import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { resolveTenant } from "../../middleware/tenant.js";
import { UserRole } from "@prisma/client";
import { HttpError } from "../../utils/errors.js";
import * as routesService from "./routes.service.js";

const searchQuerySchema = z
  .object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    originCity: z.string().optional(),
    destinationCity: z.string().optional(),
    originStationId: z.string().optional(),
    destinationStationId: z.string().optional(),
    /** Accepted for client parity; schedule filtering happens on `/schedules/available`. */
    date: z.string().optional(),
  })
  .refine(
    (q) =>
      (q.originStationId && q.destinationStationId) ||
      ((q.originCity?.trim() || q.origin?.trim()) &&
        (q.destinationCity?.trim() || q.destination?.trim())),
    {
      message:
        "Provide origin+destination (city names) or originStationId+destinationStationId",
    },
  );

export const routesModuleRouter = Router();

routesModuleRouter.get(
  "/search",
  requireAuth,
  resolveTenant,
  async (req, res, next) => {
    try {
      const q = searchQuerySchema.parse(req.query);
      const admin = req.user?.role === UserRole.ADMIN;
      const passenger = req.user?.role === UserRole.PASSENGER;
      if (!req.tenantId && !admin && !passenger) {
        next(new HttpError(400, "tenant_required", "Missing tenant context"));
        return;
      }
      const data = await routesService.searchRoutes({
        tenantId: req.tenantId ?? null,
        admin,
        passenger,
        origin: q.origin,
        destination: q.destination,
        originCity: q.originCity,
        destinationCity: q.destinationCity,
        originStationId: q.originStationId,
        destinationStationId: q.destinationStationId,
      });
      res.json({ data });
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(
          new HttpError(400, "validation_error", "Invalid query", e.flatten()),
        );
        return;
      }
      if (e instanceof Error && e.message === "tenant_required") {
        next(new HttpError(400, "tenant_required", "Tenant required for this role"));
        return;
      }
      next(e);
    }
  },
);
