import { Router } from "express";
import {
  CompanyStatus,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import * as analyticsService from "../analytics/analytics.service.js";
import * as bookingsService from "../bookings/bookings.service.js";
import {
  adminBookingsQuerySchema,
  adminUsersQuerySchema,
  patchCompanyStatusSchema,
} from "../company/operator.schemas.js";
import { routeParam } from "../../utils/params.js";

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
        peakBookingTimes: peak.map((p) => ({
          hour: p.hour,
          bookings: Number(p.bookings),
        })),
        busPerformanceRanking: buses.map((b) => ({
          bus_id: b.bus_id,
          plate: b.plate,
          company_id: b.company_id,
          trips: Number(b.trips),
          revenue: b.revenue.toString(),
        })),
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

adminRouter.patch(
  "/companies/:id",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  validateBody(patchCompanyStatusSchema),
  async (req, res, next) => {
    try {
      const { status } = req.body as { status: CompanyStatus };
      const row = await prisma.company.update({
        where: { id: routeParam(req.params.id)! },
        data: { status },
      });
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.get(
  "/bookings",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  validateQuery(adminBookingsQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.validatedQuery as z.infer<typeof adminBookingsQuerySchema>;
      const skip = (q.page - 1) * q.limit;
      const { data, total } = await bookingsService.listAllBookingsAdmin({
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
        companyId: q.companyId,
        status: q.status,
        skip,
        take: q.limit,
      });
      res.json({
        data,
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      });
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.get(
  "/users",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  validateQuery(adminUsersQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.validatedQuery as z.infer<typeof adminUsersQuerySchema>;
      const skip = (q.page - 1) * q.limit;
      const where = q.role ? { role: q.role as UserRole } : {};
      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: q.limit,
          select: {
            id: true,
            phone: true,
            role: true,
            companyId: true,
            createdAt: true,
            company: { select: { name: true, slug: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      res.json({
        data,
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      });
    } catch (e) {
      next(e);
    }
  },
);
