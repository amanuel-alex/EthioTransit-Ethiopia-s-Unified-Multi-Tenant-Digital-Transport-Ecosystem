"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useTenant } from "@/lib/tenant/tenant-context";
import { apiRequest, type ApiRequestAuth } from "./client";
import type {
  AdminCompanyRow,
  BookingRow,
  ChapaInitResponse,
  CompanyDashboardStats,
  CreateBookingResponse,
  MpesaInitResponse,
  RouteSearchRow,
  ScheduleDetail,
} from "./types";

export function useApiAuth(): ApiRequestAuth {
  const { accessToken, user } = useAuth();
  const { companyId } = useTenant();
  return useMemo(
    () => ({
      accessToken,
      companyId,
      user,
    }),
    [accessToken, companyId, user],
  );
}

export function useApi() {
  const auth = useApiAuth();

  return useMemo(
    () => ({
      searchRoutes: (origin: string, destination: string) =>
        apiRequest<{ data: RouteSearchRow[] }>(
          `/api/v1/routes/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
          { method: "GET", auth },
        ),

      schedulesByRoute: (routeId: string, from: string, to: string) =>
        apiRequest<{ data: ScheduleDetail[] }>(
          `/api/v1/schedules/available?routeId=${encodeURIComponent(routeId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { method: "GET", auth },
        ),

      scheduleAvailability: (scheduleId: string) =>
        apiRequest<ScheduleDetail>(
          `/api/v1/schedules/available?scheduleId=${encodeURIComponent(scheduleId)}`,
          { method: "GET", auth },
        ),

      createBooking: (scheduleId: string, seats: number[]) =>
        apiRequest<CreateBookingResponse>("/api/v1/bookings/create", {
          method: "POST",
          json: { scheduleId, seats },
          auth,
        }),

      cancelBooking: (bookingId: string) =>
        apiRequest<{ id: string; status: string }>(
          "/api/v1/bookings/cancel",
          {
            method: "POST",
            json: { bookingId },
            auth,
          },
        ),

      listUserBookings: () =>
        apiRequest<{ data: BookingRow[] }>("/api/v1/bookings/user", {
          method: "GET",
          auth,
        }),

      listCompanyBookings: () =>
        apiRequest<{ data: BookingRow[] }>("/api/v1/bookings/company", {
          method: "GET",
          auth,
        }),

      initiateMpesa: (bookingId: string, phoneNumber: string) =>
        apiRequest<MpesaInitResponse>("/api/v1/payments/mpesa/initiate", {
          method: "POST",
          json: { bookingId, phoneNumber },
          auth,
        }),

      initiateChapa: (
        bookingId: string,
        email: string,
        firstName?: string,
        lastName?: string,
      ) =>
        apiRequest<ChapaInitResponse>("/api/v1/payments/chapa/initiate", {
          method: "POST",
          json: { bookingId, email, firstName, lastName },
          auth,
        }),

      companyDashboard: () =>
        apiRequest<CompanyDashboardStats>("/api/v1/company/dashboard", {
          method: "GET",
          auth,
        }),

      companyRevenue: () =>
        apiRequest<Record<string, unknown>>("/api/v1/company/revenue", {
          method: "GET",
          auth,
        }),

      adminCompanies: () =>
        apiRequest<{ data: AdminCompanyRow[] }>("/api/v1/admin/companies", {
          method: "GET",
          auth,
        }),

      adminAnalytics: () =>
        apiRequest<Record<string, unknown>>("/api/v1/admin/analytics", {
          method: "GET",
          auth,
        }),
    }),
    [auth],
  );
}
