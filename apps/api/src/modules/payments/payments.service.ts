import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { splitCommission } from "../../utils/commission.js";
import { initiateMpesaStk } from "./services/mpesa.service.js";
import { initiateChapaTransaction } from "./services/chapa.service.js";

export async function assertBookingPayable(params: {
  tenantId: string;
  userId: string;
  bookingId: string;
}) {
  const booking = await prisma.booking.findFirst({
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
  return booking;
}

export async function initiateMpesaPayment(params: {
  tenantId: string;
  userId: string;
  bookingId: string;
  phoneNumber: string;
}) {
  const booking = await assertBookingPayable({
    tenantId: params.tenantId,
    userId: params.userId,
    bookingId: params.bookingId,
  });

  const { platformFee, companyEarning } = splitCommission(booking.totalAmount);

  const payment = await prisma.payment.create({
    data: {
      companyId: booking.companyId,
      bookingId: booking.id,
      userId: booking.userId,
      provider: PaymentProvider.MPESA,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: PaymentStatus.PENDING,
      platformFee,
      companyEarning,
    },
  });

  const stk = await initiateMpesaStk({
    phoneNumber: params.phoneNumber,
    amount: Number(booking.totalAmount),
    accountReference: payment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || payment.id.slice(0, 12),
    transactionDesc: `BK${payment.id.slice(-8)}`,
  });

  if (!stk.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, rawPayload: { error: stk } as object },
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
  };
}

export async function initiateChapaPayment(params: {
  tenantId: string;
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

  const { platformFee, companyEarning } = splitCommission(booking.totalAmount);

  const payment = await prisma.payment.create({
    data: {
      companyId: booking.companyId,
      bookingId: booking.id,
      userId: booking.userId,
      provider: PaymentProvider.CHAPA,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: PaymentStatus.PENDING,
      platformFee,
      companyEarning,
    },
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
      data: { status: PaymentStatus.FAILED, rawPayload: { error: chapa } as object },
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
 * Mark payment and booking paid, release seat locks. Idempotent if already paid.
 */
export async function confirmPaymentByProvider(params: {
  paymentId?: string;
  externalRef?: string;
  provider: PaymentProvider;
  mpesaReceipt?: string;
  rawPayload?: object;
  /** When M-Pesa omits amount in callback, skip amount check */
  paidAmount?: number;
}) {
  const orClause = [
    ...(params.paymentId ? [{ id: params.paymentId }] : []),
    ...(params.externalRef ? [{ externalRef: params.externalRef }] : []),
  ];
  if (orClause.length === 0) {
    throw new HttpError(400, "invalid_query", "Missing payment identifier");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: params.provider,
      OR: orClause,
    },
    include: {
      booking: { include: { seats: true } },
    },
  });

  if (!payment) {
    throw new HttpError(404, "payment_not_found", "Payment not found");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return { ok: true, duplicate: true as const };
  }

  if (params.paidAmount != null) {
    const expected = Number(payment.amount);
    if (Math.abs(expected - params.paidAmount) > 0.05) {
      throw new HttpError(400, "amount_mismatch", "Paid amount does not match booking");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        mpesaReceipt: params.mpesaReceipt,
        rawPayload: params.rawPayload ?? undefined,
      },
    });

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.PAID },
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

  return { ok: true, duplicate: false as const };
}
