import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/errors.js";
import { resolveCompanyScope } from "../../utils/tenant-resolve.js";
import * as schedulesService from "./schedules.service.js";

export const schedulesRouter = Router();

const upcomingQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

schedulesRouter.get(
  "/upcoming",
  requireAuth,
  async (req, res, next) => {
    try {
      if (req.user?.role !== UserRole.PASSENGER) {
        next(
          new HttpError(
            403,
            "forbidden",
            "This listing is only available to passengers",
          ),
        );
        return;
      }
      const q = upcomingQuery.parse(req.query);
      const data = await schedulesService.listUpcomingForPassenger(
        q.limit ?? 8,
      );
      res.json({ data });
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(
          new HttpError(400, "validation_error", "Invalid query", e.flatten()),
        );
        return;
      }
      next(e);
    }
  },
);

const availableQuery = z
  .object({
    scheduleId: z.string().min(1).optional(),
    routeId: z.string().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((q) => q.scheduleId || (q.routeId && q.from && q.to), {
    message: "Provide scheduleId OR routeId+from+to",
  });

schedulesRouter.get(
  "/available",
  requireAuth,
  async (req, res, next) => {
    try {
      const q = availableQuery.parse(req.query);
      const tenantId = await resolveCompanyScope(req, {
        scheduleId: q.scheduleId,
        routeId: q.routeId,
      });
      if (!tenantId) {
        next(
          new HttpError(
            400,
            "tenant_required",
            "Missing operator context — sign in again or pick a trip from search.",
          ),
        );
        return;
      }

      if (q.scheduleId) {
        const data = await schedulesService.getAvailableForSchedule(
          tenantId,
          q.scheduleId,
        );
        res.json(data);
        return;
      }

      const data = await schedulesService.listAvailableByRoute(
        tenantId,
        q.routeId!,
        q.from!,
        q.to!,
      );
      res.json({ data });
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(
          new HttpError(400, "validation_error", "Invalid query", e.flatten()),
        );
        return;
      }
      next(e);
    }
  },
);
