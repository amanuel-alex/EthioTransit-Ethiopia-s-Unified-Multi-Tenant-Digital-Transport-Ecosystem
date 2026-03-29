import {
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/errors.js";
import { splitCommission } from "../../utils/commission.js";

function lockExpiresAt(): Date {
  const env = loadEnv();
  const ms = env.SEAT_LOCK_TTL_MINUTES * 60 * 1000;
  return new Date(Date.now() + ms);
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
  return prisma.$transaction(async (tx) => {
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
}

export async function listForUser(tenantId: string, userId: string) {
  return prisma.booking.findMany({
    where: { companyId: tenantId, userId },
    include: {
      schedule: { include: { route: true, bus: true } },
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
      schedule: { include: { route: true, bus: true } },
      seats: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
