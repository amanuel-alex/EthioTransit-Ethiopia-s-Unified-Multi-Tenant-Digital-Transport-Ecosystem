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
      searchRoutes: (origin: string, destination: string, date?: string) => {
        const q = new URLSearchParams({
          origin: origin.trim(),
          destination: destination.trim(),
        });
        if (date?.trim()) q.set("date", date.trim());
        return apiRequest<{ data: RouteSearchRow[] }>(
          `/api/v1/routes/search?${q.toString()}`,
          { method: "GET", auth },
        );
      },

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

      listCompanyBookings: (params?: {
        from?: string;
        to?: string;
        routeId?: string;
        status?: string;
      }) => {
        const q = new URLSearchParams();
        if (params?.from) q.set("from", params.from);
        if (params?.to) q.set("to", params.to);
        if (params?.routeId) q.set("routeId", params.routeId);
        if (params?.status) q.set("status", params.status);
        const qs = q.toString();
        return apiRequest<{ data: BookingRow[] }>(
          `/api/v1/bookings/company${qs ? `?${qs}` : ""}`,
          { method: "GET", auth },
        );
      },

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

      adminPatchCompany: (companyId: string, status: "ACTIVE" | "SUSPENDED") =>
        apiRequest<AdminCompanyRow>(`/api/v1/admin/companies/${companyId}`, {
          method: "PATCH",
          json: { status },
          auth,
        }),

      adminBookings: (params?: {
        page?: number;
        limit?: number;
        companyId?: string;
        status?: string;
        from?: string;
        to?: string;
      }) => {
        const q = new URLSearchParams();
        if (params?.page != null) q.set("page", String(params.page));
        if (params?.limit != null) q.set("limit", String(params.limit));
        if (params?.companyId) q.set("companyId", params.companyId);
        if (params?.status) q.set("status", params.status);
        if (params?.from) q.set("from", params.from);
        if (params?.to) q.set("to", params.to);
        return apiRequest<{
          data: BookingRow[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(`/api/v1/admin/bookings?${q.toString()}`, { method: "GET", auth });
      },

      adminUsers: (params?: {
        page?: number;
        limit?: number;
        role?: string;
      }) => {
        const q = new URLSearchParams();
        if (params?.page != null) q.set("page", String(params.page));
        if (params?.limit != null) q.set("limit", String(params.limit));
        if (params?.role) q.set("role", params.role);
        return apiRequest<{
          data: {
            id: string;
            phone: string;
            role: string;
            companyId: string | null;
            createdAt: string;
            company: { name: string; slug: string } | null;
          }[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(`/api/v1/admin/users?${q.toString()}`, { method: "GET", auth });
      },

      companyBuses: () =>
        apiRequest<{ data: unknown[] }>("/api/v1/company/buses", {
          method: "GET",
          auth,
        }),

      companyRoutes: () =>
        apiRequest<{ data: unknown[] }>("/api/v1/company/routes", {
          method: "GET",
          auth,
        }),

      companySchedules: (params?: { from?: string; to?: string }) => {
        const q = new URLSearchParams();
        if (params?.from) q.set("from", params.from);
        if (params?.to) q.set("to", params.to);
        const qs = q.toString();
        return apiRequest<{ data: unknown[] }>(
          `/api/v1/company/schedules${qs ? `?${qs}` : ""}`,
          { method: "GET", auth },
        );
      },

      companyDrivers: () =>
        apiRequest<{ data: unknown[] }>("/api/v1/company/drivers", {
          method: "GET",
          auth,
        }),

      companyFinance: () =>
        apiRequest<Record<string, unknown>>("/api/v1/company/finance", {
          method: "GET",
          auth,
        }),
    }),
    [auth],
  );
}
