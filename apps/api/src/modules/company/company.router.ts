import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import * as analyticsService from "../analytics/analytics.service.js";

export const companyRouter = Router();

companyRouter.get(
  "/dashboard",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const stats = await analyticsService.companyDashboardStats(req.tenantId!);
      res.json(stats);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.get(
  "/revenue",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const [agg, peak, buses, kmCompany] = await Promise.all([
        analyticsService.companyRevenueScoped(tenantId),
        analyticsService.peakBookingHours(),
        analyticsService.busPerformanceRanking(50),
        analyticsService.companyKmMetrics(tenantId),
      ]);

      const scopedProfit = (await analyticsService.profitPerRoute(80)).filter(
        (r) => r.company_id === tenantId,
      );

      res.json({
        payments: {
          count: agg._count,
          gross: agg._sum.amount?.toString() ?? "0",
          platformFees: agg._sum.platformFee?.toString() ?? "0",
          companyEarnings: agg._sum.companyEarning?.toString() ?? "0",
        },
        profitByRoute: scopedProfit,
        km: kmCompany,
        peakBookingHours: peak,
        topBusesForCompany: buses.filter((b) => b.company_id === tenantId),
      });
    } catch (e) {
      next(e);
    }
  },
);
