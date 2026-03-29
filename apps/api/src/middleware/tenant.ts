import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { HttpError } from "../utils/errors.js";

const HEADER = "x-company-id";

function pickHeaderCompany(req: Request): string | undefined {
  const h = req.headers[HEADER];
  return typeof h === "string" ? h.trim() : undefined;
}

/**
 * Resolves tenant companyId for row-level isolation.
 * - COMPANY: JWT must include companyId.
 * - PASSENGER: require x-company-id header.
 * - ADMIN: optional header or query companyId (null if absent).
 */
export function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new HttpError(401, "unauthorized", "Not authenticated"));
    return;
  }

  const headerCompany = pickHeaderCompany(req);
  const queryCompany =
    typeof req.query.companyId === "string" ? req.query.companyId.trim() : undefined;

  if (req.user.role === UserRole.COMPANY) {
    if (!req.user.companyId) {
      next(
        new HttpError(
          403,
          "tenant_missing",
          "Company user must be linked to a company",
        ),
      );
      return;
    }
    req.tenantId = req.user.companyId;
    next();
    return;
  }

  if (req.user.role === UserRole.PASSENGER) {
    if (!headerCompany) {
      next(
        new HttpError(
          400,
          "tenant_required",
          `Passenger requests must send ${HEADER}`,
        ),
      );
      return;
    }
    req.tenantId = headerCompany;
    next();
    return;
  }

  if (req.user.role === UserRole.ADMIN) {
    req.tenantId = headerCompany ?? queryCompany ?? null;
    next();
    return;
  }

  next(new HttpError(403, "forbidden", "Unknown role"));
}

/** Requires a concrete tenant (dashboard, revenue, passenger flows). */
export function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new HttpError(401, "unauthorized", "Not authenticated"));
    return;
  }

  const headerCompany = pickHeaderCompany(req);
  const queryCompany =
    typeof req.query.companyId === "string" ? req.query.companyId.trim() : undefined;

  if (req.user.role === UserRole.COMPANY) {
    if (!req.user.companyId) {
      next(new HttpError(403, "tenant_missing", "Company user must have companyId"));
      return;
    }
    req.tenantId = req.user.companyId;
    next();
    return;
  }

  if (req.user.role === UserRole.PASSENGER) {
    if (!headerCompany) {
      next(
        new HttpError(400, "tenant_required", `Passenger requests must send ${HEADER}`),
      );
      return;
    }
    req.tenantId = headerCompany;
    next();
    return;
  }

  if (req.user.role === UserRole.ADMIN) {
    const id = headerCompany ?? queryCompany;
    if (!id) {
      next(
        new HttpError(
          400,
          "tenant_required",
          `Admin scoped requests need ${HEADER} or companyId query`,
        ),
      );
      return;
    }
    req.tenantId = id;
    next();
    return;
  }

  next(new HttpError(403, "forbidden", "Unknown role"));
}
