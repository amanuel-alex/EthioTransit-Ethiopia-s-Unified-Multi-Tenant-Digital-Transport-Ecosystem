import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { splitCommission } from "../../utils/commission.js";
import { initiateMpesaStk } from "./services/mpesa.service.js";
import { initiateChapaTransaction } from "./services/chapa.service.js";

export async function assertBookingPayable(params: {
  tenantId: string | null;
  userId: string;
  bookingId: string;
}) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: params.bookingId,
      ...(params.tenantId ? { companyId: params.tenantId } : {}),
      userId: params.userId,
      status: BookingStatus.PENDING,
    },
    include: { seats: true },
  });
  if (!booking) {
    throw new HttpError(404, "not_found", "Pending booking not found");
  }
  return booking;
}

async function getOrCreatePendingPayment(params: {
  booking: {
    id: string;
    companyId: string;
    userId: string;
    totalAmount: Prisma.Decimal;
    currency: string;
  };
  provider: PaymentProvider;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: {
          bookingId: params.booking.id,
          status: PaymentStatus.PENDING,
        },
      });
      if (existing) {
        if (existing.provider !== params.provider) {
          throw new HttpError(
            409,
            "payment_provider_conflict",
            "This booking already has a pending payment using a different provider. Cancel it or complete that flow first.",
          );
        }
        return existing;
      }
      const { platformFee, companyEarning } = splitCommission(
        params.booking.totalAmount,
      );
      return tx.payment.create({
        data: {
          companyId: params.booking.companyId,
          bookingId: params.booking.id,
          userId: params.booking.userId,
          provider: params.provider,
          amount: params.booking.totalAmount,
          currency: params.booking.currency,
          status: PaymentStatus.PENDING,
          platformFee,
          companyEarning,
        },
      });
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const row = await prisma.payment.findFirst({
        where: {
          bookingId: params.booking.id,
          status: PaymentStatus.PENDING,
        },
      });
      if (row && row.provider === params.provider) return row;
    }
    throw e;
  }
}

export async function initiateMpesaPayment(params: {
  tenantId: string | null;
  userId: string;
  bookingId: string;
  phoneNumber: string;
}) {
  const booking = await assertBookingPayable({
    tenantId: params.tenantId,
    userId: params.userId,
    bookingId: params.bookingId,
  });

  const payment = await getOrCreatePendingPayment({
    booking,
    provider: PaymentProvider.MPESA,
  });

  if (payment.externalRef && payment.status === PaymentStatus.PENDING) {
    return {
      paymentId: payment.id,
      checkoutRequestId: payment.externalRef,
      merchantRequestId: null as string | null | undefined,
      idempotent: true as const,
    };
  }

  const stk = await initiateMpesaStk({
    phoneNumber: params.phoneNumber,
    amount: Number(booking.totalAmount),
    accountReference:
      payment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) ||
      payment.id.slice(0, 12),
    transactionDesc: `BK${payment.id.slice(-8)}`,
  });

  if (!stk.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        rawPayload: { error: stk } as object,
      },
    });
    throw new HttpError(stk.status, stk.code, stk.message);
  }

  const ext =
    stk.data.checkoutRequestId ?? stk.data.merchantRequestId ?? payment.id;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { externalRef: ext },
  });

  return {
    paymentId: payment.id,
    checkoutRequestId: stk.data.checkoutRequestId,
    merchantRequestId: stk.data.merchantRequestId,
    idempotent: false as const,
  };
}

export async function initiateChapaPayment(params: {
  tenantId: string | null;
  userId: string;
  bookingId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const booking = await assertBookingPayable({
    tenantId: params.tenantId,
    userId: params.userId,
    bookingId: params.bookingId,
  });

  const payment = await getOrCreatePendingPayment({
    booking,
    provider: PaymentProvider.CHAPA,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { externalRef: payment.id },
  });

  const chapa = await initiateChapaTransaction({
    amount: booking.totalAmount.toString(),
    currency: booking.currency,
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    tx_ref: payment.id,
  });

  if (!chapa.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        rawPayload: { error: chapa } as object,
      },
    });
    throw new HttpError(chapa.status, chapa.code, chapa.message);
  }

  return {
    paymentId: payment.id,
    checkoutUrl: chapa.data.checkoutUrl,
    txRef: chapa.data.txRef,
  };
}

/**
 * M-Pesa STK declined / cancelled: fail payment and release seat locks so the customer can retry.
 */
export async function failMpesaPaymentByCheckoutId(params: {
  checkoutRequestId: string;
  rawPayload: object;
  resultCode: number;
  resultDesc: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: PaymentProvider.MPESA,
      externalRef: params.checkoutRequestId,
      status: PaymentStatus.PENDING,
    },
    include: { booking: { include: { seats: true } } },
  });
  if (!payment) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        rawPayload: {
          ...(typeof params.rawPayload === "object" &&
          params.rawPayload !== null &&
          !Array.isArray(params.rawPayload)
            ? params.rawPayload
            : {}),
          mpesaResultCode: params.resultCode,
          mpesaResultDesc: params.resultDesc,
        } as object,
      },
    });
    const seatNos = payment.booking.seats.map((s) => s.seatNo);
    if (seatNos.length) {
      await tx.seatLock.deleteMany({
        where: {
          scheduleId: payment.booking.scheduleId,
          seatNo: { in: seatNos },
        },
      });
    }
  });

  return { ok: true as const };
}

/**
 * Mark payment and booking paid, release seat locks. Idempotent if already paid.
 */
export async function confirmPaymentByProvider(params: {
  paymentId?: string;
  externalRef?: string;
  provider: PaymentProvider;
  mpesaReceipt?: string;
  rawPayload?: object;
  paidAmount?: number;
}) {
  const include = { booking: { include: { seats: true as const } } } as const;

  let payment =
    params.externalRef && !params.paymentId
      ? await prisma.payment.findUnique({
          where: {
            provider_externalRef: {
              provider: params.provider,
              externalRef: params.externalRef,
            },
          },
          include,
        })
      : null;

  if (params.paymentId) {
    const byId = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include,
    });
    if (byId && byId.provider !== params.provider) {
      throw new HttpError(400, "provider_mismatch", "Payment provider mismatch");
    }
    payment = byId ?? payment;
  }

  if (!payment) {
    const orClause = [
      ...(params.paymentId ? [{ id: params.paymentId }] : []),
      ...(params.externalRef ? [{ externalRef: params.externalRef }] : []),
    ];
    if (orClause.length === 0) {
      throw new HttpError(400, "invalid_query", "Missing payment identifier");
    }
    payment = await prisma.payment.findFirst({
      where: { provider: params.provider, OR: orClause },
      include,
    });
  }

  if (!payment) {
    throw new HttpError(404, "payment_not_found", "Payment not found");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return { ok: true, duplicate: true as const };
  }

  if (params.paidAmount != null) {
    const expected = Number(payment.amount);
    if (Math.abs(expected - params.paidAmount) > 0.05) {
      throw new HttpError(
        400,
        "amount_mismatch",
        "Paid amount does not match booking",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment!.id },
      data: {
        status: PaymentStatus.COMPLETED,
        mpesaReceipt: params.mpesaReceipt,
        rawPayload: params.rawPayload ?? undefined,
      },
    });

    await tx.booking.update({
      where: { id: payment!.bookingId },
      data: { status: BookingStatus.PAID },
    });

    const seatNos = payment!.booking.seats.map((s) => s.seatNo);
    if (seatNos.length) {
      await tx.seatLock.deleteMany({
        where: {
          scheduleId: payment!.booking.scheduleId,
          seatNo: { in: seatNos },
        },
      });
    }
  });

  return { ok: true, duplicate: false as const };
}
