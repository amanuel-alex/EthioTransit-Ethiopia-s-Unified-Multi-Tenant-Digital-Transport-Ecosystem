import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import * as analyticsService from "../analytics/analytics.service.js";

export const adminRouter = Router();

adminRouter.get(
  "/companies",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  async (_req, res, next) => {
    try {
      const data = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json({ data });
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.get(
  "/analytics",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  async (_req, res, next) => {
    try {
      const [
        revenueByCompany,
        profitRoutes,
        km,
        peak,
        buses,
      ] = await Promise.all([
        analyticsService.revenuePerCompany(),
        analyticsService.profitPerRoute(15),
        analyticsService.aggregateKmMetrics(),
        analyticsService.peakBookingHours(),
        analyticsService.busPerformanceRanking(15),
      ]);

      res.json({
        revenuePerCompany: revenueByCompany,
        profitPerRoute: profitRoutes,
        mostProfitableRoutes: profitRoutes.slice(0, 10),
        km: km,
        peakBookingTimes: peak,
        busPerformanceRanking: buses,
      });
    } catch (e) {
      next(e);
    }
  },
);
