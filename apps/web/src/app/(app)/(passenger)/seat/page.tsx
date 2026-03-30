"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import {
  Armchair,
  BadgeCheck,
  Bus,
  Shield,
  Wifi,
  Zap,
} from "lucide-react";
import { BookingSummaryBar } from "@/components/booking/booking-summary-bar";
import { SeatMap } from "@/components/booking/seat-map";
import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import type { ScheduleDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { saveCheckoutDraft } from "@/lib/booking/checkout-storage";

/** Immersive dark shell: passenger app shell stays light unless user enables global dark. */
function SeatExperienceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark -mx-4 min-h-[65vh] rounded-2xl bg-zinc-950 px-4 py-6 text-zinc-50 shadow-xl ring-1 ring-white/10 sm:mx-0 sm:px-6 md:px-8">
      {children}
    </div>
  );
}

function SeatSkeletonCoach() {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6">
      <Skeleton className="mb-6 h-12 w-full max-w-md rounded-xl bg-white/5" />
      <div className="mx-auto max-w-md space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl bg-white/5" />
            <Skeleton className="h-12 flex-1 rounded-xl bg-white/5" />
            <Skeleton className="h-12 w-2 shrink-0 rounded-full bg-white/5" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") ?? "";
  const api = useApi();
  const { logout } = useAuth();
  const reduceMotion = useReducedMotion();
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
      <SeatExperienceShell>
        <p className="text-zinc-400">
          Missing schedule. Go back to{" "}
          <button
            type="button"
            className="font-medium text-[hsl(152,65%,48%)] underline underline-offset-4 hover:text-[hsl(152,65%,55%)]"
            onClick={() => router.push("/search")}
          >
            search
          </button>
          .
        </p>
      </SeatExperienceShell>
    );
  }

  if (loading || !detail) {
    return (
      <SeatExperienceShell>
        <div className="space-y-6 pb-40">
          <Skeleton className="h-8 w-full max-w-lg rounded-lg bg-white/10" />
          <Skeleton className="h-4 w-2/3 max-w-xl rounded bg-white/10" />
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,320px)]">
            <SeatSkeletonCoach />
            <Skeleton className="hidden min-h-[420px] rounded-2xl bg-white/10 lg:block" />
          </div>
        </div>
      </SeatExperienceShell>
    );
  }

  const cap = detail.schedule.bus.seatCapacity;
  const route = detail.schedule.route;
  const routeTitle = route
    ? `${route.origin} — ${route.destination}`
    : "Trip";
  const departs = new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(detail.schedule.departsAt));
  const busLabel = `${detail.schedule.bus.plateNumber} · Luxury coach`;

  return (
    <SeatExperienceShell>
      <div className="pb-40 pt-2">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="mb-8 space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Select your{" "}
          <span className="text-[hsl(152,65%,48%)]">Throne</span>
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400 md:text-base">
          {routeTitle}
          <span className="text-zinc-600"> · </span>
          <span className="text-zinc-300">{busLabel}</span>
          <span className="mt-1 block text-xs text-zinc-500">{departs}</span>
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,320px)] lg:items-start">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded border-2 border-[hsl(152,65%,42%)]/80 bg-zinc-800/40"
                aria-hidden
              />
              Available
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded border-2 border-[hsl(152,65%,48%)] bg-[hsl(152,65%,48%)] shadow-[0_0_12px_hsla(152,65%,48%,0.4)]"
                aria-hidden
              />
              Selected
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded border border-zinc-600 bg-zinc-800/50 opacity-70"
                aria-hidden
              />
              Booked
            </div>
          </div>

          <SeatMap
            layout="coach"
            capacity={cap}
            available={availableSet}
            occupied={occupiedSet}
            selected={selected}
            onToggle={toggle}
          />
        </div>

        <aside className="lg:sticky lg:top-24">
          <GlassCard className="overflow-hidden border-white/10 bg-zinc-900/40 p-0 backdrop-blur-xl">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-800 via-zinc-900 to-emerald-950/40">
              <div className="absolute inset-0 flex items-center justify-center opacity-90">
                <Bus
                  className="h-24 w-24 text-zinc-600 sm:h-28 sm:w-28"
                  strokeWidth={1}
                  aria-hidden
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950/90 to-transparent" />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    {detail.schedule.bus.plateNumber}
                  </h2>
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-[hsl(152,65%,48%)]"
                    aria-label="Verified fleet"
                  />
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-400/90">
                  Premium fleet
                </p>
              </div>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]" />
                  High-speed Wi‑Fi on board
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]" />
                  USB charging at every seat
                </li>
                <li className="flex items-start gap-3">
                  <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]" />
                  Reclining seats &amp; extra legroom
                </li>
              </ul>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      Safe passage
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      GPS-tracked trips and insured operators on the EthioTransit
                      network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>

      <BookingSummaryBar
        seatCount={selected.length}
        unitPrice={detail.schedule.basePrice}
        selectedSeats={selected}
        onCancelSelection={() => setSelected([])}
        onContinue={() => void onContinue()}
        loading={submitting}
        disabled={submitting}
      />
      </div>
    </SeatExperienceShell>
  );
}

export default function SeatPage() {
  return (
    <Suspense
      fallback={
        <div className="dark -mx-4 rounded-2xl bg-zinc-950 px-4 py-8 sm:mx-0">
          <Skeleton className="h-64 w-full rounded-xl bg-white/10" />
        </div>
      }
    >
      <SeatPageInner />
    </Suspense>
  );
}
