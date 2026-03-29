import { Router } from "express";
import {
  CompanyStatus,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
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
        include: {
          _count: { select: { buses: true } },
        },
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
        paymentTotals,
        companyTotals,
      ] = await Promise.all([
        analyticsService.revenuePerCompany(),
        analyticsService.profitPerRoute(15),
        analyticsService.aggregateKmMetrics(),
        analyticsService.peakBookingHours(),
        analyticsService.busPerformanceRanking(15),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED },
          _sum: { amount: true, platformFee: true, companyEarning: true },
        }),
        prisma.company.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

      const operatorsByStatus = Object.fromEntries(
        companyTotals.map((r) => [r.status, r._count._all]),
      ) as Record<string, number>;

      res.json({
        revenuePerCompany: revenueByCompany,
        profitPerRoute: profitRoutes,
        mostProfitableRoutes: profitRoutes.slice(0, 10),
        km: km,
        peakBookingTimes: peak,
        busPerformanceRanking: buses,
        paymentTotals: {
          gross: paymentTotals._sum.amount?.toString() ?? "0",
          platformFees: paymentTotals._sum.platformFee?.toString() ?? "0",
          companyEarnings: paymentTotals._sum.companyEarning?.toString() ?? "0",
        },
        operators: {
          total: companyTotals.reduce((a, r) => a + r._count._all, 0),
          active: operatorsByStatus[CompanyStatus.ACTIVE] ?? 0,
          suspended: operatorsByStatus[CompanyStatus.SUSPENDED] ?? 0,
        },
      });
    } catch (e) {
      next(e);
    }
  },
);
