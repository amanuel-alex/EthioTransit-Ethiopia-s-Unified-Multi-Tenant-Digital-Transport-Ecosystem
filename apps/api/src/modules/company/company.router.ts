import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import * as analyticsService from "../analytics/analytics.service.js";
import {
  companySchedulesQuerySchema,
  createBusSchema,
  createDriverSchema,
  createRouteSchema,
  createScheduleSchema,
  updateBusSchema,
  updateDriverSchema,
  updateRouteSchema,
  updateScheduleSchema,
} from "./operator.schemas.js";
import { routeParam } from "../../utils/params.js";
import * as operatorService from "./operator.service.js";

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

companyRouter.get(
  "/finance",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const summary = await analyticsService.companyFinanceSummary(
        req.tenantId!,
      );
      res.json(summary);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.get(
  "/buses",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const rows = await operatorService.listBuses(req.tenantId!);
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.post(
  "/buses",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(createBusSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.createBus(req.tenantId!, req.body);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.patch(
  "/buses/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(updateBusSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.updateBus(
        req.tenantId!,
        routeParam(req.params.id)!,
        req.body,
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.delete(
  "/buses/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const out = await operatorService.deleteBus(
        req.tenantId!,
        routeParam(req.params.id)!,
      );
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.get(
  "/routes",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const rows = await operatorService.listRoutes(req.tenantId!);
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.post(
  "/routes",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(createRouteSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.createRoute(req.tenantId!, req.body);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.patch(
  "/routes/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(updateRouteSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.updateRoute(
        req.tenantId!,
        routeParam(req.params.id)!,
        req.body,
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.delete(
  "/routes/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const out = await operatorService.deleteRoute(
        req.tenantId!,
        routeParam(req.params.id)!,
      );
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.get(
  "/schedules",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateQuery(companySchedulesQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.validatedQuery as {
        from?: string;
        to?: string;
      };
      const rows = await operatorService.listSchedules(
        req.tenantId!,
        q.from ? new Date(q.from) : undefined,
        q.to ? new Date(q.to) : undefined,
      );
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.post(
  "/schedules",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(createScheduleSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.createSchedule(req.tenantId!, req.body);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.patch(
  "/schedules/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(updateScheduleSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.updateSchedule(
        req.tenantId!,
        routeParam(req.params.id)!,
        req.body,
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.delete(
  "/schedules/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const out = await operatorService.deleteSchedule(
        req.tenantId!,
        routeParam(req.params.id)!,
      );
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.get(
  "/drivers",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const rows = await operatorService.listDrivers(req.tenantId!);
      res.json({ data: rows });
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.post(
  "/drivers",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(createDriverSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.createDriver(req.tenantId!, req.body);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.patch(
  "/drivers/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  validateBody(updateDriverSchema),
  async (req, res, next) => {
    try {
      const row = await operatorService.updateDriver(
        req.tenantId!,
        routeParam(req.params.id)!,
        req.body,
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

companyRouter.delete(
  "/drivers/:id",
  requireAuth,
  requireRoles(UserRole.COMPANY),
  requireTenant,
  async (req, res, next) => {
    try {
      const out = await operatorService.deleteDriver(
        req.tenantId!,
        routeParam(req.params.id)!,
      );
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
);
