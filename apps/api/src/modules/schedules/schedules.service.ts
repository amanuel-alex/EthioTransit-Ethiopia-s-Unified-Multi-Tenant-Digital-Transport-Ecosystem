import { BookingStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

function isLockActive(expiresAt: Date) {
  return expiresAt > new Date();
}

export async function getAvailableForSchedule(tenantId: string, scheduleId: string) {
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
