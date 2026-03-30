import { BookingStatus, CompanyStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

function isLockActive(expiresAt: Date) {
  return expiresAt > new Date();
}

async function assertCompanyActive(tenantId: string) {
  const company = await prisma.company.findFirst({
    where: { id: tenantId },
    select: { status: true },
  });
  if (!company || company.status !== CompanyStatus.ACTIVE) {
    throw new HttpError(403, "company_inactive", "This operator is not available");
  }
}

export async function getAvailableForSchedule(tenantId: string, scheduleId: string) {
  await assertCompanyActive(tenantId);
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, companyId: tenantId },
    include: {
      bus: true,
      route: true,
      seatLocks: true,
      bookings: {
        where: { status: BookingStatus.PAID },
        include: { seats: true },
      },
    },
  });

  if (!schedule) {
    throw new HttpError(404, "not_found", "Schedule not found for tenant");
  }

  const capacity = schedule.bus.seatCapacity;
  const occupied = new Set<number>();

  for (const b of schedule.bookings) {
    for (const s of b.seats) {
      occupied.add(s.seatNo);
    }
  }
  for (const lock of schedule.seatLocks) {
    if (isLockActive(lock.expiresAt)) {
      occupied.add(lock.seatNo);
    }
  }

  const available: number[] = [];
  for (let i = 1; i <= capacity; i++) {
    if (!occupied.has(i)) available.push(i);
  }

  return {
    schedule: {
      id: schedule.id,
      departsAt: schedule.departsAt,
      arrivesAt: schedule.arrivesAt,
      basePrice: schedule.basePrice.toString(),
      route: schedule.route,
      bus: { id: schedule.bus.id, plateNumber: schedule.bus.plateNumber, seatCapacity: schedule.bus.seatCapacity },
    },
    availableSeats: available,
    occupiedSeats: [...occupied].sort((a, b) => a - b),
  };
}

export async function listAvailableByRoute(
  tenantId: string,
  routeId: string,
  from: Date,
  to: Date,
) {
  await assertCompanyActive(tenantId);
  const schedules = await prisma.schedule.findMany({
    where: {
      companyId: tenantId,
      routeId,
      departsAt: { gte: from, lte: to },
    },
    include: { bus: true, route: true },
    orderBy: { departsAt: "asc" },
  });

  const out = [];
  for (const s of schedules) {
    const detail = await getAvailableForSchedule(tenantId, s.id);
    out.push(detail);
  }
  return out;
}

/** Next departures across all active operators (passenger home / discovery). */
export async function listUpcomingForPassenger(limit: number) {
  const cap = Math.min(Math.max(limit, 1), 50);
  const now = new Date();
  const schedules = await prisma.schedule.findMany({
    where: {
      departsAt: { gte: now },
      company: { status: CompanyStatus.ACTIVE },
    },
    include: { company: { select: { name: true } } },
    orderBy: { departsAt: "asc" },
    take: cap,
  });

  const out: {
    detail: Awaited<ReturnType<typeof getAvailableForSchedule>>;
    companyName: string;
  }[] = [];

  for (const s of schedules) {
    const detail = await getAvailableForSchedule(s.companyId, s.id);
    out.push({ detail, companyName: s.company.name });
  }

  return out;
}
