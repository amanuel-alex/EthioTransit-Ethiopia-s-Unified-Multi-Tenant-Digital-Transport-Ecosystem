import {
  BookingStatus,
  CompanyStatus,
  Prisma,
} from "@prisma/client";
import { routeWithStationsInclude } from "../../db/route-include.js";
import { prisma } from "../../db/prisma.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/errors.js";
import { splitCommission } from "../../utils/commission.js";

function lockExpiresAt(): Date {
  const env = loadEnv();
  const ms = env.SEAT_LOCK_TTL_MINUTES * 60 * 1000;
  return new Date(Date.now() + ms);
}

async function assertCompanyActive(tx: Prisma.TransactionClient, companyId: string) {
  const company = await tx.company.findFirst({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company || company.status !== CompanyStatus.ACTIVE) {
    throw new HttpError(403, "company_inactive", "This operator is not accepting bookings");
  }
}

async function assertSeatsFree(
  tx: Prisma.TransactionClient,
  tenantId: string,
  scheduleId: string,
  seats: number[],
  capacity: number,
  userId: string,
) {
  const unique = [...new Set(seats)].sort((a, b) => a - b);
  if (unique.length !== seats.length) {
    throw new HttpError(400, "duplicate_seat", "Duplicate seat in request");
  }
  for (const seat of unique) {
    if (seat < 1 || seat > capacity) {
      throw new HttpError(400, "invalid_seat", `Seat ${seat} out of range`);
    }
  }

  await tx.seatLock.deleteMany({
    where: { scheduleId, expiresAt: { lt: new Date() } },
  });

  for (const seatNo of unique) {
    const paid = await tx.bookingSeat.findFirst({
      where: {
        seatNo,
        booking: {
          scheduleId,
          companyId: tenantId,
          status: BookingStatus.PAID,
        },
      },
    });
    if (paid) {
      throw new HttpError(409, "seat_taken", `Seat ${seatNo} already paid`);
    }

    const lock = await tx.seatLock.findFirst({
      where: {
        scheduleId,
        seatNo,
        expiresAt: { gt: new Date() },
      },
    });
    if (
      lock &&
      lock.holderUserId &&
      lock.holderUserId !== userId
    ) {
      throw new HttpError(409, "seat_locked", `Seat ${seatNo} is locked`);
    }
  }
}

export async function createBooking(params: {
  tenantId: string;
  userId: string;
  scheduleId: string;
  seats: number[];
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      await assertCompanyActive(tx, params.tenantId);

      const pendingBooking = await tx.booking.findFirst({
        where: {
          userId: params.userId,
          scheduleId: params.scheduleId,
          status: BookingStatus.PENDING,
        },
      });
      if (pendingBooking) {
        throw new HttpError(
          409,
          "pending_booking_exists",
          "You already have a pending booking on this schedule. Cancel it or complete payment first.",
        );
      }

      const schedule = await tx.schedule.findFirst({
        where: { id: params.scheduleId, companyId: params.tenantId },
        include: { bus: true },
      });
      if (!schedule) {
        throw new HttpError(404, "not_found", "Schedule not found");
      }

      await assertSeatsFree(
        tx,
        params.tenantId,
        params.scheduleId,
        params.seats,
        schedule.bus.seatCapacity,
        params.userId,
      );

      const unit = schedule.basePrice;
      const total = unit.mul(params.seats.length);
      const { platformFee, companyEarning } = splitCommission(total);

      const expiresAt = lockExpiresAt();

      for (const seatNo of params.seats) {
        await tx.seatLock.upsert({
          where: {
            scheduleId_seatNo: {
              scheduleId: params.scheduleId,
              seatNo,
            },
          },
          update: {
            expiresAt,
            holderUserId: params.userId,
            companyId: params.tenantId,
          },
          create: {
            companyId: params.tenantId,
            scheduleId: params.scheduleId,
            seatNo,
            holderUserId: params.userId,
            expiresAt,
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          companyId: params.tenantId,
          scheduleId: params.scheduleId,
          userId: params.userId,
          status: BookingStatus.PENDING,
          totalAmount: total,
          platformFee,
          companyEarning,
          currency: "ETB",
          seats: {
            create: params.seats.map((seatNo) => ({ seatNo })),
          },
        },
        include: { seats: true },
      });

      return booking;
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "seat_conflict",
        "One or more seats were taken by another customer. Please choose different seats.",
      );
    }
    throw e;
  }
}

export async function cancelBooking(params: {
  tenantId: string;
  userId: string;
  bookingId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: params.bookingId,
        companyId: params.tenantId,
        userId: params.userId,
        status: BookingStatus.PENDING,
      },
      include: { seats: true },
    });
    if (!booking) {
      throw new HttpError(404, "not_found", "Pending booking not found");
    }

    const seatNos = booking.seats.map((s) => s.seatNo);
    await tx.seatLock.deleteMany({
      where: {
        scheduleId: booking.scheduleId,
        seatNo: { in: seatNos },
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });

    return { id: booking.id, status: BookingStatus.CANCELLED };
  });
}

export async function listForUser(tenantId: string, userId: string) {
  return prisma.booking.findMany({
    where: { companyId: tenantId, userId },
    include: {
      schedule: {
        include: { route: { include: routeWithStationsInclude }, bus: true },
      },
      seats: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** All bookings for a passenger across operators (no x-company-id). */
export async function listForUserAll(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      schedule: {
        include: { route: { include: routeWithStationsInclude }, bus: true },
      },
      seats: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listForCompany(tenantId: string) {
  return prisma.booking.findMany({
    where: { companyId: tenantId },
    include: {
      user: { select: { id: true, phone: true } },
      schedule: {
        include: { route: { include: routeWithStationsInclude }, bus: true },
      },
      seats: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listForCompanyFiltered(
  tenantId: string,
  filters: {
    from?: Date;
    to?: Date;
    routeId?: string;
    status?: BookingStatus;
  },
) {
  const where: Prisma.BookingWhereInput = { companyId: tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }
  if (filters.routeId) {
    where.schedule = { routeId: filters.routeId };
  }

  return prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, phone: true } },
      schedule: {
        include: { route: { include: routeWithStationsInclude }, bus: true },
      },
      seats: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function listAllBookingsAdmin(params: {
  from?: Date;
  to?: Date;
  companyId?: string;
  status?: BookingStatus;
  skip: number;
  take: number;
}) {
  const where: Prisma.BookingWhereInput = {};
  if (params.companyId) where.companyId = params.companyId;
  if (params.status) where.status = params.status;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = params.from;
    if (params.to) where.createdAt.lte = params.to;
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, phone: true } },
        company: { select: { id: true, name: true, slug: true } },
        schedule: {
        include: { route: { include: routeWithStationsInclude }, bus: true },
      },
        seats: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, total };
}
