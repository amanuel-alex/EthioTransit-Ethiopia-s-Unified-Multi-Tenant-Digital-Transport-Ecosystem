"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingSummaryBar } from "@/components/booking/booking-summary-bar";
import { SeatMap } from "@/components/booking/seat-map";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import type { ScheduleDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { saveCheckoutDraft } from "@/lib/booking/checkout-storage";

function SeatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const api = useApi();
  const { logout } = useAuth();
  const [detail, setDetail] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const load = useCallback(async () => {
    if (!scheduleId) return;
    setLoading(true);
    try {
      const d = await api.scheduleAvailability(scheduleId);
      setDetail(d);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Could not load seats");
    } finally {
      setLoading(false);
    }
  }, [api, scheduleId, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableSet = useMemo(() => {
    if (!detail) return new Set<number>();
    return new Set(detail.availableSeats);
  }, [detail]);

  const occupiedSet = useMemo(() => {
    if (!detail) return new Set<number>();
    return new Set(detail.occupiedSeats);
  }, [detail]);

  const toggle = (seatNo: number) => {
    if (!availableSet.has(seatNo)) return;
    setSelected((prev) =>
      prev.includes(seatNo)
        ? prev.filter((x) => x !== seatNo)
        : [...prev, seatNo].sort((a, b) => a - b),
    );
  };

  const onContinue = async () => {
    if (!detail || selected.length === 0) return;
    setSubmitting(true);
    try {
      const { booking } = await api.createBooking(detail.schedule.id, selected);
      const route = detail.schedule.route;
      const label = route
        ? `${route.origin} → ${route.destination}`
        : "Trip";
      saveCheckoutDraft({
        bookingId: booking.id,
        totalAmount: booking.totalAmount,
        currency: "ETB",
        scheduleId: detail.schedule.id,
        seatNumbers: booking.seats,
        routeLabel: label,
        departsAt: detail.schedule.departsAt,
      });
      toast.success("Booking created — complete payment");
      router.push("/checkout");
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!scheduleId) {
    return (
      <p className="text-muted-foreground">
        Missing schedule. Go back to{" "}
        <button
          type="button"
          className="text-primary underline"
          onClick={() => router.push("/search")}
        >
          search
        </button>
        .
      </p>
    );
  }

  if (loading || !detail) {
    return (
      <div className="space-y-4 pb-32">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  const cap = detail.schedule.bus.seatCapacity;

  return (
    <div className="pb-32">
      <PageHeader
        title="Choose seats"
        description={`${detail.schedule.route?.origin ?? ""} → ${detail.schedule.route?.destination ?? ""} · ${new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.schedule.departsAt))}`}
      />
      <SeatMap
        capacity={cap}
        available={availableSet}
        occupied={occupiedSet}
        selected={selected}
        onToggle={toggle}
      />
      <BookingSummaryBar
        seatCount={selected.length}
        unitPrice={detail.schedule.basePrice}
        onContinue={() => void onContinue()}
        loading={submitting}
        disabled={submitting}
      />
    </div>
  );
}

export default function SeatPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SeatPageInner />
    </Suspense>
  );
}
