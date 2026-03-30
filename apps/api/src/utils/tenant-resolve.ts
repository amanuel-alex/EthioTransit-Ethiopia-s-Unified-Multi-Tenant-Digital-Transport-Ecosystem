import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { pickHeaderCompany } from "../middleware/tenant.js";

/** Effective company scope for schedule/booking/payment writes and reads. */
export async function resolveCompanyScope(
  req: Request,
  opts: { scheduleId?: string; routeId?: string; bookingId?: string },
): Promise<string | null> {
  if (!req.user) return null;
  const header = pickHeaderCompany(req);

  if (req.user.role === UserRole.COMPANY) {
    return req.user.companyId ?? null;
  }

  if (req.user.role === UserRole.ADMIN) {
    const queryCompany =
      typeof req.query.companyId === "string" ? req.query.companyId.trim() : undefined;
    return header ?? queryCompany ?? null;
  }

  if (req.user.role === UserRole.PASSENGER) {
    if (header) return header;
    if (opts.scheduleId) {
      const s = await prisma.schedule.findFirst({
        where: { id: opts.scheduleId },
        select: { companyId: true },
      });
      return s?.companyId ?? null;
    }
    if (opts.routeId) {
      const r = await prisma.route.findFirst({
        where: { id: opts.routeId },
        select: { companyId: true },
      });
      return r?.companyId ?? null;
    }
    if (opts.bookingId) {
      const b = await prisma.booking.findFirst({
        where: { id: opts.bookingId, userId: req.user.id },
        select: { companyId: true },
      });
      return b?.companyId ?? null;
    }
  }

  return null;
}
