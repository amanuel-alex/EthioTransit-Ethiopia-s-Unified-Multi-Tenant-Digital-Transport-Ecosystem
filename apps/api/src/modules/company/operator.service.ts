import { BookingStatus, Prisma } from "@prisma/client";
import type { z } from "zod";
import { routeWithStationsInclude } from "../../db/route-include.js";
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
  const imageUrl =
    data.imageUrl === undefined || data.imageUrl === ""
      ? null
      : data.imageUrl.trim();
  const vehicleName =
    data.vehicleName == null || data.vehicleName.trim() === ""
      ? null
      : data.vehicleName.trim();
  return prisma.bus.create({
    data: {
      companyId,
      plateNumber: data.plateNumber.trim(),
      seatCapacity: data.seatCapacity,
      costPerKm: dec(data.costPerKm),
      status: data.status,
      imageUrl,
      vehicleName,
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

  const patch: Prisma.BusUpdateInput = {
    ...(data.plateNumber !== undefined
      ? { plateNumber: data.plateNumber.trim() }
      : {}),
    ...(data.seatCapacity !== undefined
      ? { seatCapacity: data.seatCapacity }
      : {}),
    ...(data.costPerKm !== undefined ? { costPerKm: dec(data.costPerKm) } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
  if (data.imageUrl !== undefined) {
    patch.imageUrl = data.imageUrl === "" ? null : data.imageUrl.trim();
  }
  if (data.vehicleName !== undefined) {
    patch.vehicleName =
      data.vehicleName === null || data.vehicleName === ""
        ? null
        : data.vehicleName.trim();
  }

  return prisma.bus.update({
    where: { id: busId },
    data: patch,
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
    include: routeWithStationsInclude,
  });
}

export async function createRoute(companyId: string, data: CreateRoute) {
  const [originSt, destSt] = await Promise.all([
    prisma.busStation.findUnique({
      where: { id: data.originStationId },
      include: { city: true },
    }),
    prisma.busStation.findUnique({
      where: { id: data.destinationStationId },
      include: { city: true },
    }),
  ]);

  if (!originSt || !destSt) {
    throw new HttpError(400, "invalid_stations", "Invalid origin or destination station");
  }

  if (originSt.cityId === destSt.cityId) {
    throw new HttpError(
      400,
      "same_city_route",
      "Origin and destination stations must be in different cities",
    );
  }

  return prisma.route.create({
    data: {
      companyId,
      origin: originSt.city.name,
      destination: destSt.city.name,
      originStationId: originSt.id,
      destinationStationId: destSt.id,
      distanceKm: dec(data.distanceKm),
      pricePerKm:
        data.pricePerKm != null ? dec(data.pricePerKm) : null,
    },
    include: routeWithStationsInclude,
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

  let origin = existing.origin;
  let destination = existing.destination;
  let originStationId = existing.originStationId;
  let destinationStationId = existing.destinationStationId;

  if (data.originStationId !== undefined) {
    const st = await prisma.busStation.findUnique({
      where: { id: data.originStationId },
      include: { city: true },
    });
    if (!st) {
      throw new HttpError(400, "invalid_stations", "Invalid origin station");
    }
    originStationId = st.id;
    origin = st.city.name;
  }

  if (data.destinationStationId !== undefined) {
    const st = await prisma.busStation.findUnique({
      where: { id: data.destinationStationId },
      include: { city: true },
    });
    if (!st) {
      throw new HttpError(400, "invalid_stations", "Invalid destination station");
    }
    destinationStationId = st.id;
    destination = st.city.name;
  }

  if (originStationId && destinationStationId) {
    const [a, b] = await Promise.all([
      prisma.busStation.findUnique({
        where: { id: originStationId },
        select: { cityId: true },
      }),
      prisma.busStation.findUnique({
        where: { id: destinationStationId },
        select: { cityId: true },
      }),
    ]);
    if (a && b && a.cityId === b.cityId) {
      throw new HttpError(
        400,
        "same_city_route",
        "Origin and destination stations must be in different cities",
      );
    }
  }

  return prisma.route.update({
    where: { id: routeId },
    data: {
      origin,
      destination,
      originStationId,
      destinationStationId,
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
    include: routeWithStationsInclude,
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
    include: { route: { include: routeWithStationsInclude }, bus: true },
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
    include: { route: { include: routeWithStationsInclude }, bus: true },
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
    include: { route: { include: routeWithStationsInclude }, bus: true },
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
