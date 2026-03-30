"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import {
  Armchair,
  BadgeCheck,
  Shield,
  Usb,
  Wifi,
} from "lucide-react";
import { BookingSummaryBar } from "@/components/booking/booking-summary-bar";
import { SeatMap } from "@/components/booking/seat-map";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import type { ScheduleDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { saveCheckoutDraft } from "@/lib/booking/checkout-storage";

const BUS_HERO_SRC =
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=960&q=82";

function SeatSkeletonCoach() {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-zinc-900/80 p-6">
      <div className="mb-6 flex justify-end border-b border-white/10 pb-5">
        <Skeleton className="h-11 w-11 rounded-full bg-white/10" />
      </div>
      <div className="mx-auto max-w-lg space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 sm:gap-3">
            <Skeleton className="h-12 flex-1 rounded-full bg-white/5" />
            <Skeleton className="h-12 flex-1 rounded-full bg-white/5" />
            <Skeleton className="h-12 w-2 shrink-0 rounded-full bg-white/5" />
            <Skeleton className="h-12 flex-1 rounded-full bg-white/5" />
            <Skeleton className="h-12 flex-1 rounded-full bg-white/5" />
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

  useEffect(() => {
    document.documentElement.style.scrollPaddingBottom = "8rem";
    return () => {
      document.documentElement.style.scrollPaddingBottom = "";
    };
  }, []);

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

  const shell = (children: ReactNode, opts?: { bareMessage?: boolean }) => (
    <div
      className={cnShell(
        "text-zinc-50",
        opts?.bareMessage ? "py-10" : "pb-56 pt-6 sm:pt-8",
      )}
    >
      {children}
    </div>
  );

  if (!scheduleId) {
    return shell(
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
      </p>,
      { bareMessage: true },
    );
  }

  if (loading || !detail) {
    return shell(
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full max-w-lg rounded-lg bg-white/10" />
          <Skeleton className="h-4 w-2/3 max-w-xl rounded bg-white/10" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)] lg:items-start">
          <SeatSkeletonCoach />
          <Skeleton className="hidden min-h-[480px] rounded-2xl bg-white/10 lg:block" />
        </div>
      </div>,
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
  const plate = detail.schedule.bus.plateNumber;
  const busLine = `${plate} · Luxury express`;

  return shell(
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="mb-8 space-y-3"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-tight">
          Select your{" "}
          <span className="text-[hsl(152,65%,48%)]">Throne</span>
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-500 md:text-base">
          <span className="font-medium text-zinc-300">{routeTitle}</span>
          <span className="text-zinc-700"> • </span>
          <span>{busLine}</span>
        </p>
        <p className="text-xs text-zinc-600">{departs}</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)] lg:items-start lg:gap-10">
        <div className="space-y-6">
          <div
            className="flex flex-wrap gap-2 sm:gap-3"
            role="list"
            aria-label="Seat legend"
          >
            <div
              role="listitem"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-800/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-[hsl(152,65%,48%)] bg-zinc-900/90"
                aria-hidden
              />
              Available
            </div>
            <div
              role="listitem"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-800/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-[hsl(152,65%,44%)] bg-[hsl(152,65%,48%)] shadow-[0_0_12px_hsla(152,65%,48%,0.35)]"
                aria-hidden
              />
              Selected
            </div>
            <div
              role="listitem"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-800/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border border-zinc-600 bg-zinc-700/90"
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

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/55 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
            <div className="relative aspect-[4/3] bg-zinc-950">
              <Image
                src={BUS_HERO_SRC}
                alt="Intercity coach"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 360px, 100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    {plate} Executive
                  </h2>
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-[hsl(152,65%,48%)]"
                    aria-label="Verified fleet"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400/95">
                  Premium fleet
                </p>
              </div>
              <ul className="space-y-3.5 text-sm leading-snug text-zinc-300">
                <li className="flex items-start gap-3">
                  <Wifi
                    className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                    strokeWidth={2}
                  />
                  High-speed 5G Wi‑Fi
                </li>
                <li className="flex items-start gap-3">
                  <Usb
                    className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                    strokeWidth={2}
                  />
                  USB‑C fast charging
                </li>
                <li className="flex items-start gap-3">
                  <Armchair
                    className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                    strokeWidth={2}
                  />
                  180° reclining seats
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
            <div className="flex gap-3">
              <Shield
                className="h-5 w-5 shrink-0 text-amber-400"
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  Safe passage guarantee
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Real-time GPS tracking &amp; premium insurance included.
                </p>
              </div>
            </div>
          </div>
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
    </>,
  );
}

function cnShell(...parts: (string | undefined | false)[]) {
  return [
    "relative -mx-4 w-[calc(100%+2rem)] max-w-none sm:-mx-6 sm:w-[calc(100%+3rem)]",
    "seat-page-canvas min-h-[calc(100dvh-8rem)] px-4 sm:px-6",
    ...parts.filter(Boolean),
  ].join(" ");
}

export default function SeatPage() {
  return (
    <Suspense
      fallback={
        <div className={cnShell("py-10")}>
          <Skeleton className="h-64 w-full rounded-xl bg-white/10" />
        </div>
      }
    >
      <SeatPageInner />
    </Suspense>
  );
}
