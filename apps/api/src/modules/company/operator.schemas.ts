import { z } from "zod";
import { BookingStatus, BusStatus, CompanyStatus } from "@prisma/client";

export const createBusSchema = z.object({
  plateNumber: z.string().min(1).max(32),
  seatCapacity: z.number().int().min(1).max(120),
  costPerKm: z.number().nonnegative(),
  status: z.nativeEnum(BusStatus).optional(),
});

export const updateBusSchema = z.object({
  plateNumber: z.string().min(1).max(32).optional(),
  seatCapacity: z.number().int().min(1).max(120).optional(),
  costPerKm: z.number().nonnegative().optional(),
  status: z.nativeEnum(BusStatus).optional(),
});

export const createRouteSchema = z.object({
  origin: z.string().min(1).max(128),
  destination: z.string().min(1).max(128),
  distanceKm: z.number().positive(),
  pricePerKm: z.number().nonnegative().optional().nullable(),
});

export const updateRouteSchema = z.object({
  origin: z.string().min(1).max(128).optional(),
  destination: z.string().min(1).max(128).optional(),
  distanceKm: z.number().positive().optional(),
  pricePerKm: z.number().nonnegative().nullable().optional(),
});

export const createScheduleSchema = z.object({
  routeId: z.string().min(1),
  busId: z.string().min(1),
  departsAt: z.string().datetime(),
  arrivesAt: z.string().datetime(),
  basePrice: z.number().nonnegative(),
});

export const updateScheduleSchema = z.object({
  routeId: z.string().min(1).optional(),
  busId: z.string().min(1).optional(),
  departsAt: z.string().datetime().optional(),
  arrivesAt: z.string().datetime().optional(),
  basePrice: z.number().nonnegative().optional(),
});

export const createDriverSchema = z.object({
  fullName: z.string().min(1).max(160),
  salary: z.number().nonnegative(),
  assignedBusId: z.string().min(1).nullable().optional(),
});

export const updateDriverSchema = z.object({
  fullName: z.string().min(1).max(160).optional(),
  salary: z.number().nonnegative().optional(),
  assignedBusId: z.string().min(1).nullable().optional(),
});

export const companyBookingsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  routeId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});

export const adminBookingsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  companyId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export const adminUsersQuerySchema = z.object({
  role: z.enum(["PASSENGER", "COMPANY", "ADMIN"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export const patchCompanyStatusSchema = z.object({
  status: z.nativeEnum(CompanyStatus),
});
