import { Prisma } from "@prisma/client";
import {
  BookingStatus,
  BusStatus,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export async function revenuePerCompany() {
  return prisma.$queryRaw<
    { company_id: string; name: string; revenue: Prisma.Decimal }[]
  >`
    SELECT c.id AS company_id, c.name,
           COALESCE(SUM(p.amount), 0)::decimal AS revenue
    FROM "Company" c
    LEFT JOIN "Payment" p ON p."companyId" = c.id AND p.status::text = ${PaymentStatus.COMPLETED}
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `;
}

export async function profitPerRoute(limit = 20) {
  const take = Math.min(100, Math.max(1, Math.floor(limit)));
  return prisma.$queryRaw<
    {
      route_id: string;
      origin: string;
      destination: string;
      company_id: string;
      revenue: Prisma.Decimal;
      estimated_cost: Prisma.Decimal;
      profit: Prisma.Decimal;
    }[]
  >`
    SELECT r.id AS route_id, r.origin, r.destination, r."companyId" AS company_id,
           COALESCE(SUM(b."companyEarning"), 0)::decimal AS revenue,
           COALESCE(SUM(r."distanceKm" * bus."costPerKm"), 0)::decimal AS estimated_cost,
           (COALESCE(SUM(b."companyEarning"), 0) - COALESCE(SUM(r."distanceKm" * bus."costPerKm"), 0))::decimal AS profit
    FROM "Route" r
    JOIN "Schedule" s ON s."routeId" = r.id
    JOIN "Bus" bus ON bus.id = s."busId"
    LEFT JOIN "Booking" b ON b."scheduleId" = s.id AND b.status::text = ${BookingStatus.PAID}
    GROUP BY r.id, r.origin, r.destination, r."companyId"
    ORDER BY profit DESC
    LIMIT ${take}
  `;
}

export async function aggregateKmMetrics() {
  const rows = await prisma.$queryRaw<
    {
      total_distance_km: Prisma.Decimal;
      total_company_earning: Prisma.Decimal;
      total_estimated_cost: Prisma.Decimal;
    }[]
  >`
    SELECT
      COALESCE(SUM(r."distanceKm"), 0)::decimal AS total_distance_km,
      COALESCE(SUM(b."companyEarning"), 0)::decimal AS total_company_earning,
      COALESCE(SUM(r."distanceKm" * bus."costPerKm"), 0)::decimal AS total_estimated_cost
    FROM "Booking" b
    JOIN "Schedule" s ON s.id = b."scheduleId"
    JOIN "Route" r ON r.id = s."routeId"
    JOIN "Bus" bus ON bus.id = s."busId"
    WHERE b.status::text = ${BookingStatus.PAID}
  `;
  const row = rows[0];
  const dist = Number(row?.total_distance_km ?? 0);
  const earn = Number(row?.total_company_earning ?? 0);
  const cost = Number(row?.total_estimated_cost ?? 0);
  return {
    totalDistanceKm: dist,
    totalCompanyEarning: earn,
    totalEstimatedCost: cost,
    revenuePerKm: dist > 0 ? earn / dist : 0,
    costPerKm: dist > 0 ? cost / dist : 0,
  };
}

export async function peakBookingHours() {
  return prisma.$queryRaw<{ hour: number; bookings: bigint }[]>`
    SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*)::bigint AS bookings
    FROM "Booking"
    GROUP BY hour
    ORDER BY bookings DESC
  `;
}

export async function busPerformanceRanking(limit = 20) {
  const take = Math.min(100, Math.max(1, Math.floor(limit)));
  return prisma.$queryRaw<
    { bus_id: string; plate: string; company_id: string; trips: bigint; revenue: Prisma.Decimal }[]
  >`
    SELECT b.id AS bus_id, b."plateNumber" AS plate, b."companyId" AS company_id,
           COUNT(DISTINCT bk.id)::bigint AS trips,
           COALESCE(SUM(bk."companyEarning"), 0)::decimal AS revenue
    FROM "Bus" b
    LEFT JOIN "Schedule" s ON s."busId" = b.id
    LEFT JOIN "Booking" bk ON bk."scheduleId" = s.id AND bk.status::text = ${BookingStatus.PAID}
    GROUP BY b.id, b."plateNumber", b."companyId"
    ORDER BY revenue DESC
    LIMIT ${take}
  `;
}

export async function companyKmMetrics(companyId: string) {
  const rows = await prisma.$queryRaw<
    {
      total_distance_km: Prisma.Decimal;
      total_company_earning: Prisma.Decimal;
      total_estimated_cost: Prisma.Decimal;
    }[]
  >`
    SELECT
      COALESCE(SUM(r."distanceKm"), 0)::decimal AS total_distance_km,
      COALESCE(SUM(b."companyEarning"), 0)::decimal AS total_company_earning,
      COALESCE(SUM(r."distanceKm" * bus."costPerKm"), 0)::decimal AS total_estimated_cost
    FROM "Booking" b
    JOIN "Schedule" s ON s.id = b."scheduleId"
    JOIN "Route" r ON r.id = s."routeId"
    JOIN "Bus" bus ON bus.id = s."busId"
    WHERE b.status::text = ${BookingStatus.PAID} AND b."companyId" = ${companyId}
  `;
  const row = rows[0];
  const dist = Number(row?.total_distance_km ?? 0);
  const earn = Number(row?.total_company_earning ?? 0);
  const cost = Number(row?.total_estimated_cost ?? 0);
  return {
    totalDistanceKm: dist,
    totalCompanyEarning: earn,
    totalEstimatedCost: cost,
    revenuePerKm: dist > 0 ? earn / dist : 0,
    costPerKm: dist > 0 ? cost / dist : 0,
  };
}

export async function companyRevenueScoped(companyId: string) {
  return prisma.payment.aggregate({
    where: { companyId, status: PaymentStatus.COMPLETED },
    _sum: { amount: true, platformFee: true, companyEarning: true },
    _count: true,
  });
}

export async function companyFinanceSummary(companyId: string) {
  const [revenue, km, salaryAgg] = await Promise.all([
    companyRevenueScoped(companyId),
    companyKmMetrics(companyId),
    prisma.driver.aggregate({
      where: { companyId },
      _sum: { salary: true },
    }),
  ]);

  const gross = revenue._sum.amount?.toString() ?? "0";
  const platformFees = revenue._sum.platformFee?.toString() ?? "0";
  const companyEarnings = revenue._sum.companyEarning?.toString() ?? "0";
  const totalSalaries = salaryAgg._sum.salary?.toString() ?? "0";
  const estimatedFuelCost = km.totalEstimatedCost.toFixed(2);
  const netEstimate =
    Number(companyEarnings) -
    km.totalEstimatedCost -
    Number(totalSalaries);

  return {
    payments: {
      gross,
      platformFees,
      companyEarnings,
      completedCount: revenue._count,
    },
    operational: {
      estimatedFuelAndPerKmCost: estimatedFuelCost,
      totalSalaries,
      totalDistanceKm: km.totalDistanceKm,
      revenuePerKm: km.revenuePerKm,
      costPerKm: km.costPerKm,
    },
    netProfitEstimate: netEstimate.toFixed(2),
  };
}

export async function companyDashboardStats(companyId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [bookingsToday, pendingBookings, paidMonth, activeBuses] =
    await Promise.all([
    prisma.booking.count({
      where: { companyId, createdAt: { gte: startOfDay } },
    }),
    prisma.booking.count({
      where: { companyId, status: BookingStatus.PENDING },
    }),
    prisma.booking.count({
      where: {
        companyId,
        status: BookingStatus.PAID,
        createdAt: { gte: new Date(Date.now() - 30 * 864e5) },
      },
    }),
    prisma.bus.count({
      where: { companyId, status: BusStatus.ACTIVE },
    }),
  ]);

  const revenue = await companyRevenueScoped(companyId);

  return {
    bookingsToday,
    tripsToday: bookingsToday,
    pendingBookings,
    paidBookingsLast30Days: paidMonth,
    activeBuses,
    revenueCompleted: {
      count: revenue._count,
      gross: revenue._sum.amount?.toString() ?? "0",
      platformFees: revenue._sum.platformFee?.toString() ?? "0",
      companyEarnings: revenue._sum.companyEarning?.toString() ?? "0",
    },
  };
}
