"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { BusTripCard, type TripSearchHit } from "@/components/booking/bus-trip-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { useApi } from "@/lib/api/hooks";
import type { RouteSearchRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { localDayRangeToIso } from "@/lib/date-range";
async function fetchTripsForRoutes(
  api: ReturnType<typeof useApi>,
  routeList: RouteSearchRow[],
  day: string,
): Promise<TripSearchHit[]> {
  if (routeList.length === 0) return [];
  const { from, to } = localDayRangeToIso(day);
  const batches = await Promise.all(
    routeList.map(async (r) => {
      try {
        const { data } = await api.schedulesByRoute(r.id, from, to);
        return data.map((detail) => ({
          detail,
          companyName: r.company.name,
        }));
      } catch {
        return [];
      }
    }),
  );
  return batches
    .flat()
    .sort(
      (a, b) =>
        new Date(a.detail.schedule.departsAt).getTime() -
        new Date(b.detail.schedule.departsAt).getTime(),
    );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const { logout } = useAuth();
  const reduceMotion = useReducedMotion();

  const [origin, setOrigin] = useState(searchParams.get("origin") ?? "");
  const [destination, setDestination] = useState(
    searchParams.get("destination") ?? "",
  );
  const [date, setDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
  );
  const [trips, setTrips] = useState<TripSearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const initialSearchDone = useRef(false);

  const canSubmit = origin.trim().length > 0 && destination.trim().length > 0;

  const runSearch = useCallback(async () => {
    if (!canSubmit) {
      toast.error("Enter origin and destination");
      return;
    }
    setSearchError(null);
    setLoading(true);
    setTrips(null);
    setHasSearched(true);
    try {
      const { data: routeList } = await api.searchRoutes(
        origin.trim(),
        destination.trim(),
        date,
      );
      const flat = await fetchTripsForRoutes(api, routeList, date);
      setTrips(flat);
      const q = new URLSearchParams({
        origin: origin.trim(),
        destination: destination.trim(),
        date,
      });
      router.replace(`/search?${q.toString()}`);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        toast.error("Session expired");
        router.push("/auth");
        return;
      }
      const msg = err.message ?? "Search failed";
      setSearchError(msg);
      toast.error(msg);
      setTrips(null);
    } finally {
      setLoading(false);
    }
  }, [api, origin, destination, date, router, logout, canSubmit]);

  useEffect(() => {
    if (initialSearchDone.current) return;
    const o = searchParams.get("origin")?.trim();
    const d = searchParams.get("destination")?.trim();
    if (!o || !d) return;
    initialSearchDone.current = true;
    setOrigin(o);
    setDestination(d);
    const dt = searchParams.get("date");
    const day = dt ?? new Date().toISOString().slice(0, 10);
    if (dt) setDate(dt);

    void (async () => {
      setLoading(true);
      setHasSearched(true);
      setSearchError(null);
      setTrips(null);
      try {
        const { data: routeList } = await api.searchRoutes(o, d, day);
        const flat = await fetchTripsForRoutes(api, routeList, day);
        setTrips(flat);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          router.push("/auth");
          return;
        }
        const msg = err.message ?? "Search failed";
        setSearchError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, api, logout, router]);

  const pickSchedule = (scheduleId: string) => {
    router.push(`/seat?scheduleId=${encodeURIComponent(scheduleId)}`);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Search routes"
        description="Enter where you’re leaving from and where you’re going — we’ll show trips from all operators on your date."
      />

      {searchError ? (
        <div
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {searchError}{" "}
          <button
            type="button"
            className="ml-1 underline underline-offset-2"
            onClick={() => setSearchError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <GlassCard className="mb-10 grid gap-4 p-6 shadow-lg md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="o">From</Label>
          <Input
            id="o"
            placeholder="City or station"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="d">To</Label>
          <Input
            id="d"
            placeholder="City or station"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dt">Travel date</Label>
          <Input
            id="dt"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex md:pb-0.5">
          <Button
            type="button"
            className="h-11 w-full gap-2 rounded-xl md:min-w-[8rem]"
            disabled={loading || !canSubmit}
            onClick={() => void runSearch()}
          >
            <Search className="h-4 w-4" aria-hidden />
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </GlassCard>

      {loading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading results"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl ring-1 ring-border/60 dark:ring-white/10"
            >
              <Skeleton className="aspect-[5/3] w-full rounded-none bg-muted/60 dark:bg-white/10" />
              <div className="space-y-3 bg-muted/20 p-4 dark:bg-white/5">
                <Skeleton className="h-4 w-2/3 bg-muted dark:bg-white/10" />
                <Skeleton className="h-12 w-full bg-muted dark:bg-white/10" />
                <Skeleton className="h-11 w-full rounded-xl bg-muted dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && hasSearched && trips && trips.length === 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? false : { opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/30 px-8 py-16 text-center dark:border-white/10 dark:bg-white/5"
        >
          <MapPin className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="text-lg font-semibold text-foreground">
            No buses found
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Try another date, check spelling, or different cities. Operators add
            new schedules often — you can also{" "}
            <Link href="/home" className="font-medium text-primary underline">
              go home
            </Link>{" "}
            and start again.
          </p>
        </motion.div>
      ) : null}

      {!loading && trips && trips.length > 0 ? (
        <section aria-label="Trip results">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {trips.length} trip{trips.length === 1 ? "" : "s"} · sorted by departure
            </h2>
          </div>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: reduceMotion ? 0 : 0.03,
                },
              },
            }}
          >
            {trips.map((trip) => (
              <motion.div
                key={trip.detail.schedule.id}
                className="h-full min-h-0"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 380, damping: 30 },
                  },
                }}
              >
                <BusTripCard trip={trip} onSelectSeat={pickSchedule} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
