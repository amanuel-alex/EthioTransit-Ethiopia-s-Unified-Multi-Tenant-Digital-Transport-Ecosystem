"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, MapPin, Search } from "lucide-react";
import { BusTripCard, type TripSearchHit } from "@/components/booking/bus-trip-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function HubCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/50 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/5 backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const api = useApi();
  const reduce = useReducedMotion();

  const [upcoming, setUpcoming] = useState<TripSearchHit[] | null>(null);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

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
        const { data } = await api.upcomingTrips(8);
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
        className="mb-10 space-y-3 sm:mb-12"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.65rem] md:leading-tight">
          Your journey starts{" "}
          <span className="text-[hsl(152,65%,52%)]">here</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Search live schedules, pick seats, and pay with M-Pesa or Chapa.
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.04 }}
        className="grid gap-5 md:grid-cols-2 md:gap-6"
      >
        <HubCard>
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[hsl(152,65%,48%)]/35 bg-[hsl(152,65%,48%)]/10">
              <Search
                className="h-8 w-8 text-[hsl(152,65%,52%)]"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Find a bus
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Compare operators on your corridor with real-time availability.
            </p>
          </div>
          <Button
            asChild
            className="mt-8 h-12 gap-2 rounded-xl bg-[hsl(152,65%,48%)] px-6 text-base font-semibold text-zinc-950 shadow-[0_0_28px_hsla(152,65%,48%,0.35)] hover:bg-[hsl(152,65%,44%)]"
            size="lg"
          >
            <Link href="/search">
              Open search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </HubCard>

        <HubCard>
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10">
              <Bus
                className="h-8 w-8 text-amber-400"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              My bookings
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              View upcoming trips, tickets, and cancellation options.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-8 h-12 self-start rounded-xl border-white/15 bg-white/5 px-6 text-base font-semibold text-zinc-100 hover:bg-white/10 hover:text-white"
            size="lg"
          >
            <Link href="/bookings">View bookings</Link>
          </Button>
        </HubCard>
      </motion.div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32,
          delay: 0.08,
        }}
        className="mt-12 sm:mt-14"
        aria-label="Upcoming departures"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Available soon
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Next departures from all operators. Search to filter by route and
              date.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white"
          >
            <Link href="/search">Search all routes</Link>
          </Button>
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
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-36 w-full rounded-xl bg-white/10"
              />
            ))}
          </div>
        ) : null}

        {!upcomingLoading &&
        upcoming &&
        upcoming.length === 0 &&
        !upcomingError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 px-8 py-14 text-center ring-1 ring-white/5">
            <MapPin
              className="mb-3 h-10 w-10 text-zinc-500"
              aria-hidden
            />
            <p className="text-lg font-semibold text-white">
              No upcoming buses yet
            </p>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              Operators publish schedules regularly. Use search to find a
              specific trip, or check back later.
            </p>
            <Button
              asChild
              className="mt-6 rounded-xl bg-[hsl(152,65%,48%)] px-6 font-semibold text-zinc-950 hover:bg-[hsl(152,65%,44%)]"
            >
              <Link href="/search">Open search</Link>
            </Button>
          </div>
        ) : null}

        {!upcomingLoading && upcoming && upcoming.length > 0 ? (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: reduce ? 0 : 0.05,
                },
              },
            }}
          >
            {upcoming.map((trip) => (
              <motion.div
                key={trip.detail.schedule.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 380, damping: 30 },
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
