"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { BusTripCard, type TripSearchHit } from "@/components/booking/bus-trip-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import type { BookingRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { saveCheckoutDraft } from "@/lib/booking/checkout-storage";
import { routeLineLabel } from "@/lib/route-label";

function fmtMoney(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null && "toString" in v) {
    return String((v as { toString: () => string }).toString());
  }
  return String(v);
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const api = useApi();
  const reduce = useReducedMotion();

  const [upcoming, setUpcoming] = useState<TripSearchHit[] | null>(null);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "COMPANY") router.replace("/dashboard");
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [user?.role, router]);

  useEffect(() => {
    if (user?.role !== "PASSENGER") return;
    let cancelled = false;
    void (async () => {
      setUpcomingLoading(true);
      setUpcomingError(null);
      try {
        const { data } = await api.upcomingTrips(9);
        if (!cancelled) setUpcoming(data);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          toast.error("Session expired");
          router.push("/auth");
          return;
        }
        if (!cancelled) {
          setUpcomingError(err.message ?? "Could not load trips");
          setUpcoming([]);
        }
      } finally {
        if (!cancelled) setUpcomingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, api, logout, router]);

  useEffect(() => {
    if (user?.role !== "PASSENGER") return;
    let cancelled = false;
    void (async () => {
      setBookingsLoading(true);
      try {
        const { data } = await api.listUserBookings();
        if (!cancelled) setBookings(data);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          router.push("/auth");
          return;
        }
        if (!cancelled) {
          toast.error(err.message ?? "Could not load bookings");
          setBookings([]);
        }
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, api, logout, router]);

  const upcomingBookings = useMemo(() => {
    const list = bookings ?? [];
    const now = Date.now();
    return list
      .filter((b) => {
        if (b.status === "CANCELLED") return false;
        if (b.status === "PENDING") return true;
        return new Date(b.schedule.departsAt).getTime() >= now;
      })
      .slice(0, 5);
  }, [bookings]);

  const pickSchedule = useCallback(
    (scheduleId: string) => {
      router.push(`/seat?scheduleId=${encodeURIComponent(scheduleId)}`);
    },
    [router],
  );

  if (user?.role !== "PASSENGER") {
    return null;
  }

  return (
    <div className="relative">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="mb-8 space-y-3 sm:mb-10"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.65rem] md:leading-tight">
          Your journey starts{" "}
          <span className="text-[hsl(152,65%,52%)]">here</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Pick seats, pay with M-Pesa or Chapa, and manage trips below.{" "}
          <Link
            href="/search"
            className="font-medium text-[hsl(152,65%,52%)] underline decoration-[hsl(152,65%,48%)]/50 underline-offset-2 hover:decoration-[hsl(152,65%,48%)]"
          >
            Find a bus by route
          </Link>
          .
        </p>
      </motion.div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32,
          delay: 0.04,
        }}
        className="mb-10 sm:mb-12"
        aria-label="My bookings"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              My bookings
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Upcoming and pending payment — full history on the bookings page.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white"
          >
            <Link href="/bookings">View all</Link>
          </Button>
        </div>

        {bookingsLoading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-[5.5rem] w-full rounded-xl bg-white/10" />
            <Skeleton className="h-[5.5rem] w-full rounded-xl bg-white/10" />
          </div>
        ) : null}

        {!bookingsLoading &&
        upcomingBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 px-6 py-10 text-center ring-1 ring-white/5">
            <p className="text-sm font-medium text-zinc-300">
              No upcoming bookings
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              When you book a trip, it will show up here.
            </p>
          </div>
        ) : null}

        {!bookingsLoading && upcomingBookings.length > 0 ? (
          <ul className="space-y-2">
            {upcomingBookings.map((b) => (
              <li key={b.id}>
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 ring-1 ring-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">
                        {b.schedule.route.origin} →{" "}
                        {b.schedule.route.destination}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                        {new Intl.DateTimeFormat("en-ET", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(b.schedule.departsAt))}{" "}
                        · {b.schedule.bus.plateNumber}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Seats:{" "}
                        {b.seats.map((s) => s.seatNo).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge
                        variant={
                          b.status === "PAID"
                            ? "default"
                            : b.status === "PENDING"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {b.status}
                      </Badge>
                      <p className="text-sm font-medium text-zinc-200">
                        {fmtMoney(b.totalAmount)} {b.currency}
                      </p>
                      {b.status === "PENDING" ? (
                        <Button
                          size="sm"
                          className="h-8 rounded-lg bg-[hsl(152,65%,48%)] px-3 text-xs font-semibold text-zinc-950 hover:bg-[hsl(152,65%,44%)]"
                          onClick={() => {
                            saveCheckoutDraft({
                              bookingId: b.id,
                              totalAmount: fmtMoney(b.totalAmount),
                              currency: b.currency,
                              scheduleId: b.schedule.id,
                              seatNumbers: b.seats.map((s) => s.seatNo),
                              routeLabel: routeLineLabel(b.schedule.route),
                              departsAt: b.schedule.departsAt,
                            });
                            router.push("/checkout");
                          }}
                        >
                          Pay
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32,
          delay: 0.08,
        }}
        className="sm:mt-2"
        aria-label="Upcoming departures"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Available soon
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Next departures across operators.{" "}
              <Link
                href="/search"
                className="font-medium text-[hsl(152,65%,52%)] underline decoration-[hsl(152,65%,48%)]/50 underline-offset-2 hover:decoration-[hsl(152,65%,48%)]"
              >
                Search by date and cities
              </Link>
              .
            </p>
          </div>
        </div>

        {upcomingError ? (
          <div
            className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            {upcomingError}
          </div>
        ) : null}

        {upcomingLoading ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Loading trips"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl ring-1 ring-white/10"
              >
                <Skeleton className="aspect-[5/3] w-full rounded-none bg-white/10" />
                <div className="space-y-3 bg-zinc-900/40 p-4">
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                  <Skeleton className="h-12 w-full bg-white/10" />
                  <Skeleton className="h-11 w-full rounded-xl bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!upcomingLoading &&
        upcoming &&
        upcoming.length === 0 &&
        !upcomingError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 px-8 py-12 text-center ring-1 ring-white/5">
            <MapPin
              className="mb-3 h-10 w-10 text-zinc-500"
              aria-hidden
            />
            <p className="text-lg font-semibold text-white">
              No upcoming buses yet
            </p>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              Operators add schedules often — try{" "}
              <Link
                href="/search"
                className="font-medium text-[hsl(152,65%,52%)] underline underline-offset-2"
              >
                finding a route
              </Link>{" "}
              or check back later.
            </p>
          </div>
        ) : null}

        {!upcomingLoading && upcoming && upcoming.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: reduce ? 0 : 0.03,
                },
              },
            }}
          >
            {upcoming.map((trip) => (
              <motion.div
                key={trip.detail.schedule.id}
                className="h-full min-h-0"
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 420, damping: 32 },
                  },
                }}
              >
                <BusTripCard
                  trip={trip}
                  onSelectSeat={pickSchedule}
                  showRoute
                />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </motion.section>
    </div>
  );
}
