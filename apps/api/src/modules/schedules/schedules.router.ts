import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { HttpError } from "../../utils/errors.js";
import * as schedulesService from "./schedules.service.js";

export const schedulesRouter = Router();

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
  requireTenant,
  async (req, res, next) => {
    try {
      const q = availableQuery.parse(req.query);
      const tenantId = req.tenantId!;

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
        next(new HttpError(400, "validation_error", "Invalid query", e.flatten()));
        return;
      }
      next(e);
    }
  },
);
