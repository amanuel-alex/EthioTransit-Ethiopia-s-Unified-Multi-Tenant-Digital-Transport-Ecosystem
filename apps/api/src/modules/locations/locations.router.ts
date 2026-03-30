import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/errors.js";
import * as locationsService from "./locations.service.js";

export const locationsRouter = Router();

locationsRouter.get("/cities", requireAuth, async (_req, res, next) => {
  try {
    const data = await locationsService.listCities();
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

const stationsQuerySchema = z
  .object({
    cityId: z.string().min(1).optional(),
    citySlug: z.string().min(1).optional(),
  })
  .refine((q) => q.cityId || q.citySlug, {
    message: "cityId or citySlug required",
  });

locationsRouter.get("/stations", requireAuth, async (req, res, next) => {
  try {
    const q = stationsQuerySchema.parse(req.query);
    const data = await locationsService.listStations({
      cityId: q.cityId,
      citySlug: q.citySlug,
    });
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
});
