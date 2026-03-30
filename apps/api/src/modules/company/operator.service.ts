import { BookingStatus, Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import {
  createBusSchema,
  createDriverSchema,
  createRouteSchema,
  createScheduleSchema,
  updateBusSchema,
  updateDriverSchema,
  updateRouteSchema,
  updateScheduleSchema,
} from "./operator.schemas.js";

type CreateBus = z.infer<typeof createBusSchema>;
type UpdateBus = z.infer<typeof updateBusSchema>;
type CreateRoute = z.infer<typeof createRouteSchema>;
type UpdateRoute = z.infer<typeof updateRouteSchema>;
type CreateSchedule = z.infer<typeof createScheduleSchema>;
type UpdateSchedule = z.infer<typeof updateScheduleSchema>;
type CreateDriver = z.infer<typeof createDriverSchema>;
type UpdateDriver = z.infer<typeof updateDriverSchema>;

function dec(n: number) {
  return new Prisma.Decimal(n);
}

export async function listBuses(companyId: string) {
  return prisma.bus.findMany({
    where: { companyId },
    orderBy: { plateNumber: "asc" },
    include: { assignedDriver: true },
  });
}

export async function createBus(companyId: string, data: CreateBus) {
  return prisma.bus.create({
    data: {
      companyId,
      plateNumber: data.plateNumber.trim(),
      seatCapacity: data.seatCapacity,
      costPerKm: dec(data.costPerKm),
      status: data.status,
    },
    include: { assignedDriver: true },
  });
}

export async function updateBus(
  companyId: string,
  busId: string,
  data: UpdateBus,
) {
  const existing = await prisma.bus.findFirst({
    where: { id: busId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Bus not found");

  if (data.plateNumber) {
    const clash = await prisma.bus.findFirst({
      where: {
        companyId,
        plateNumber: data.plateNumber.trim(),
        NOT: { id: busId },
      },
    });
    if (clash) {
      throw new HttpError(409, "duplicate_plate", "Plate number already in use");
    }
  }

  return prisma.bus.update({
    where: { id: busId },
    data: {
      ...(data.plateNumber !== undefined
        ? { plateNumber: data.plateNumber.trim() }
        : {}),
      ...(data.seatCapacity !== undefined
        ? { seatCapacity: data.seatCapacity }
        : {}),
      ...(data.costPerKm !== undefined ? { costPerKm: dec(data.costPerKm) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: { assignedDriver: true },
  });
}

export async function deleteBus(companyId: string, busId: string) {
  const existing = await prisma.bus.findFirst({
    where: { id: busId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Bus not found");

  const schedCount = await prisma.schedule.count({
    where: { busId, companyId },
  });
  if (schedCount > 0) {
    throw new HttpError(
      400,
      "bus_has_schedules",
      "Remove or reassign schedules before deleting this bus",
    );
  }

  await prisma.driver.updateMany({
    where: { assignedBusId: busId, companyId },
    data: { assignedBusId: null },
  });

  await prisma.bus.delete({ where: { id: busId } });
  return { ok: true };
}

export async function listRoutes(companyId: string) {
  return prisma.route.findMany({
    where: { companyId },
    orderBy: [{ origin: "asc" }, { destination: "asc" }],
  });
}

export async function createRoute(companyId: string, data: CreateRoute) {
  return prisma.route.create({
    data: {
      companyId,
      origin: data.origin.trim(),
      destination: data.destination.trim(),
      distanceKm: dec(data.distanceKm),
      pricePerKm:
        data.pricePerKm != null ? dec(data.pricePerKm) : null,
    },
  });
}

export async function updateRoute(
  companyId: string,
  routeId: string,
  data: UpdateRoute,
) {
  const existing = await prisma.route.findFirst({
    where: { id: routeId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Route not found");

  return prisma.route.update({
    where: { id: routeId },
    data: {
      ...(data.origin !== undefined ? { origin: data.origin.trim() } : {}),
      ...(data.destination !== undefined
        ? { destination: data.destination.trim() }
        : {}),
      ...(data.distanceKm !== undefined
        ? { distanceKm: dec(data.distanceKm) }
        : {}),
      ...(data.pricePerKm !== undefined
        ? {
            pricePerKm:
              data.pricePerKm === null ? null : dec(data.pricePerKm),
          }
        : {}),
    },
  });
}

export async function deleteRoute(companyId: string, routeId: string) {
  const existing = await prisma.route.findFirst({
    where: { id: routeId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Route not found");

  const schedCount = await prisma.schedule.count({
    where: { routeId, companyId },
  });
  if (schedCount > 0) {
    throw new HttpError(
      400,
      "route_has_schedules",
      "Remove schedules on this route before deleting it",
    );
  }

  await prisma.route.delete({ where: { id: routeId } });
  return { ok: true };
}

export async function listSchedules(
  companyId: string,
  from?: Date,
  to?: Date,
) {
  const where: Prisma.ScheduleWhereInput = { companyId };
  if (from || to) {
    where.departsAt = {};
    if (from) where.departsAt.gte = from;
    if (to) where.departsAt.lte = to;
  }
  return prisma.schedule.findMany({
    where,
    orderBy: { departsAt: "asc" },
    include: { route: true, bus: true },
  });
}

export async function createSchedule(companyId: string, data: CreateSchedule) {
  const departsAt = new Date(data.departsAt);
  const arrivesAt = new Date(data.arrivesAt);
  if (arrivesAt <= departsAt) {
    throw new HttpError(400, "invalid_times", "arrivesAt must be after departsAt");
  }

  const [route, bus] = await Promise.all([
    prisma.route.findFirst({ where: { id: data.routeId, companyId } }),
    prisma.bus.findFirst({ where: { id: data.busId, companyId } }),
  ]);
  if (!route) throw new HttpError(404, "not_found", "Route not found");
  if (!bus) throw new HttpError(404, "not_found", "Bus not found");

  return prisma.schedule.create({
    data: {
      companyId,
      routeId: data.routeId,
      busId: data.busId,
      departsAt,
      arrivesAt,
      basePrice: dec(data.basePrice),
    },
    include: { route: true, bus: true },
  });
}

export async function updateSchedule(
  companyId: string,
  scheduleId: string,
  data: UpdateSchedule,
) {
  const existing = await prisma.schedule.findFirst({
    where: { id: scheduleId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Schedule not found");

  if (data.routeId) {
    const r = await prisma.route.findFirst({
      where: { id: data.routeId, companyId },
    });
    if (!r) throw new HttpError(404, "not_found", "Route not found");
  }
  if (data.busId) {
    const b = await prisma.bus.findFirst({
      where: { id: data.busId, companyId },
    });
    if (!b) throw new HttpError(404, "not_found", "Bus not found");
  }

  const departsAt = data.departsAt ? new Date(data.departsAt) : undefined;
  const arrivesAt = data.arrivesAt ? new Date(data.arrivesAt) : undefined;
  if (departsAt && arrivesAt && arrivesAt <= departsAt) {
    throw new HttpError(400, "invalid_times", "arrivesAt must be after departsAt");
  }
  const nextDepart = departsAt ?? existing.departsAt;
  const nextArrive = arrivesAt ?? existing.arrivesAt;
  if (nextArrive <= nextDepart) {
    throw new HttpError(400, "invalid_times", "arrivesAt must be after departsAt");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      ...(data.routeId !== undefined ? { routeId: data.routeId } : {}),
      ...(data.busId !== undefined ? { busId: data.busId } : {}),
      ...(departsAt !== undefined ? { departsAt } : {}),
      ...(arrivesAt !== undefined ? { arrivesAt } : {}),
      ...(data.basePrice !== undefined ? { basePrice: dec(data.basePrice) } : {}),
    },
    include: { route: true, bus: true },
  });
}

export async function deleteSchedule(companyId: string, scheduleId: string) {
  const existing = await prisma.schedule.findFirst({
    where: { id: scheduleId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Schedule not found");

  const paid = await prisma.booking.count({
    where: {
      scheduleId,
      companyId,
      status: BookingStatus.PAID,
    },
  });
  if (paid > 0) {
    throw new HttpError(
      400,
      "schedule_has_bookings",
      "Cannot delete a schedule with paid bookings",
    );
  }

  await prisma.seatLock.deleteMany({ where: { scheduleId } });
  await prisma.booking.deleteMany({
    where: { scheduleId, companyId, status: BookingStatus.PENDING },
  });
  await prisma.schedule.delete({ where: { id: scheduleId } });
  return { ok: true };
}

export async function listDrivers(companyId: string) {
  return prisma.driver.findMany({
    where: { companyId },
    orderBy: { fullName: "asc" },
    include: { assignedBus: true },
  });
}

export async function createDriver(companyId: string, data: CreateDriver) {
  if (data.assignedBusId) {
    const bus = await prisma.bus.findFirst({
      where: { id: data.assignedBusId, companyId },
    });
    if (!bus) throw new HttpError(404, "not_found", "Bus not found");
    const taken = await prisma.driver.findFirst({
      where: { assignedBusId: data.assignedBusId },
    });
    if (taken) {
      throw new HttpError(409, "bus_assigned", "Another driver already uses this bus");
    }
  }

  return prisma.driver.create({
    data: {
      companyId,
      fullName: data.fullName.trim(),
      salary: dec(data.salary),
      assignedBusId: data.assignedBusId ?? null,
    },
    include: { assignedBus: true },
  });
}

export async function updateDriver(
  companyId: string,
  driverId: string,
  data: UpdateDriver,
) {
  const existing = await prisma.driver.findFirst({
    where: { id: driverId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Driver not found");

  if (data.assignedBusId !== undefined && data.assignedBusId !== null) {
    const bus = await prisma.bus.findFirst({
      where: { id: data.assignedBusId, companyId },
    });
    if (!bus) throw new HttpError(404, "not_found", "Bus not found");
    const taken = await prisma.driver.findFirst({
      where: {
        assignedBusId: data.assignedBusId,
        NOT: { id: driverId },
      },
    });
    if (taken) {
      throw new HttpError(409, "bus_assigned", "Another driver already uses this bus");
    }
  }

  return prisma.driver.update({
    where: { id: driverId },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.salary !== undefined ? { salary: dec(data.salary) } : {}),
      ...(data.assignedBusId !== undefined
        ? { assignedBusId: data.assignedBusId }
        : {}),
    },
    include: { assignedBus: true },
  });
}

export async function deleteDriver(companyId: string, driverId: string) {
  const existing = await prisma.driver.findFirst({
    where: { id: driverId, companyId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Driver not found");
  await prisma.driver.delete({ where: { id: driverId } });
  return { ok: true };
}
