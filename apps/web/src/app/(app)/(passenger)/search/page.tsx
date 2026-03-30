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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { useApi } from "@/lib/api/hooks";
import type { RouteSearchRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { localDayRangeToIso } from "@/lib/date-range";

type CityRow = {
  id: string;
  name: string;
  slug: string;
  _count: { stations: number };
};

type StationRow = {
  id: string;
  name: string;
  address: string | null;
  city: { id: string; name: string; slug: string };
};
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

  const [cities, setCities] = useState<CityRow[] | null>(null);
  const [citiesLoadError, setCitiesLoadError] = useState<string | null>(null);
  const [originCityId, setOriginCityId] = useState("");
  const [destCityId, setDestCityId] = useState("");
  const [originStationId, setOriginStationId] = useState("");
  const [destStationId, setDestStationId] = useState("");
  const [originStations, setOriginStations] = useState<StationRow[]>([]);
  const [destStations, setDestStations] = useState<StationRow[]>([]);
  const [date, setDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
  );
  const [trips, setTrips] = useState<TripSearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const initialSearchDone = useRef(false);

  const originCityName =
    cities?.find((c) => c.id === originCityId)?.name ?? "";
  const destCityName = cities?.find((c) => c.id === destCityId)?.name ?? "";

  const canSubmit =
    Boolean(originCityId) &&
    Boolean(destCityId) &&
    originCityId !== destCityId;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.listCities();
        if (!cancelled) setCities(data);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          router.push("/auth");
          return;
        }
        if (!cancelled) {
          setCitiesLoadError(err.message ?? "Could not load cities");
          setCities([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, logout, router]);

  useEffect(() => {
    if (!cities?.length) return;
    const oName = searchParams.get("origin")?.trim();
    const dName = searchParams.get("destination")?.trim();
    if (oName) {
      const oc = cities.find(
        (x) => x.name.toLowerCase() === oName.toLowerCase(),
      );
      if (oc) setOriginCityId(oc.id);
    }
    if (dName) {
      const dc = cities.find(
        (x) => x.name.toLowerCase() === dName.toLowerCase(),
      );
      if (dc) setDestCityId(dc.id);
    }
    setOriginStationId(searchParams.get("originStationId")?.trim() ?? "");
    setDestStationId(searchParams.get("destinationStationId")?.trim() ?? "");
  }, [cities, searchParams]);

  useEffect(() => {
    if (!originCityId) {
      setOriginStations([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.listStations(originCityId);
        if (!cancelled) setOriginStations(data.stations);
      } catch {
        if (!cancelled) setOriginStations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, originCityId]);

  useEffect(() => {
    if (!destCityId) {
      setDestStations([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.listStations(destCityId);
        if (!cancelled) setDestStations(data.stations);
      } catch {
        if (!cancelled) setDestStations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, destCityId]);

  const runSearch = useCallback(async () => {
    if (!canSubmit || !originCityName || !destCityName) {
      toast.error("Choose two different cities");
      return;
    }
    setSearchError(null);
    setLoading(true);
    setTrips(null);
    setHasSearched(true);
    try {
      const stationFilter =
        originStationId && destStationId
          ? {
              originStationId,
              destinationStationId: destStationId,
            }
          : undefined;
      const { data: routeList } = await api.searchRoutes(
        originCityName,
        destCityName,
        date,
        stationFilter,
      );
      const flat = await fetchTripsForRoutes(api, routeList, date);
      setTrips(flat);
      const q = new URLSearchParams({
        origin: originCityName,
        destination: destCityName,
        date,
      });
      if (originStationId) q.set("originStationId", originStationId);
      if (destStationId) q.set("destinationStationId", destStationId);
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
  }, [
    api,
    originCityName,
    destCityName,
    date,
    router,
    logout,
    canSubmit,
    originStationId,
    destStationId,
  ]);

  useEffect(() => {
    if (initialSearchDone.current) return;
    const o = searchParams.get("origin")?.trim();
    const d = searchParams.get("destination")?.trim();
    if (!o || !d) return;
    initialSearchDone.current = true;
    const dt = searchParams.get("date");
    const day = dt ?? new Date().toISOString().slice(0, 10);
    if (dt) setDate(dt);
    const os = searchParams.get("originStationId")?.trim();
    const ds = searchParams.get("destinationStationId")?.trim();
    const stationFilter =
      os && ds ? { originStationId: os, destinationStationId: ds } : undefined;

    void (async () => {
      setLoading(true);
      setHasSearched(true);
      setSearchError(null);
      setTrips(null);
      try {
        const { data: routeList } = await api.searchRoutes(o, d, day, stationFilter);
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

      {citiesLoadError ? (
        <div
          className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-100"
          role="status"
        >
          {citiesLoadError}
        </div>
      ) : null}

      <GlassCard className="mb-10 grid gap-4 p-6 shadow-lg md:grid-cols-2 md:items-end xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="origin-city">From (city)</Label>
          <Select
            value={originCityId || undefined}
            onValueChange={(id) => {
              setOriginCityId(id);
              setOriginStationId("");
            }}
            disabled={!cities?.length}
          >
            <SelectTrigger id="origin-city" className="h-11 rounded-xl">
              <SelectValue placeholder="Select origin city" />
            </SelectTrigger>
            <SelectContent>
              {(cities ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c._count.stations > 0
                    ? ` · ${c._count.stations} terminal${c._count.stations === 1 ? "" : "s"}`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin-station">Origin terminal (optional)</Label>
          <Select
            value={originStationId || "__any__"}
            onValueChange={(v) =>
              setOriginStationId(v === "__any__" ? "" : v)
            }
            disabled={!originCityId || originStations.length === 0}
          >
            <SelectTrigger id="origin-station" className="h-11 rounded-xl">
              <SelectValue placeholder="Any terminal in city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any terminal</SelectItem>
              {originStations.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dest-city">To (city)</Label>
          <Select
            value={destCityId || undefined}
            onValueChange={(id) => {
              setDestCityId(id);
              setDestStationId("");
            }}
            disabled={!cities?.length}
          >
            <SelectTrigger id="dest-city" className="h-11 rounded-xl">
              <SelectValue placeholder="Select destination city" />
            </SelectTrigger>
            <SelectContent>
              {(cities ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c._count.stations > 0
                    ? ` · ${c._count.stations} terminal${c._count.stations === 1 ? "" : "s"}`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dest-station">Destination terminal (optional)</Label>
          <Select
            value={destStationId || "__any__"}
            onValueChange={(v) =>
              setDestStationId(v === "__any__" ? "" : v)
            }
            disabled={!destCityId || destStations.length === 0}
          >
            <SelectTrigger id="dest-station" className="h-11 rounded-xl">
              <SelectValue placeholder="Any terminal in city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any terminal</SelectItem>
              {destStations.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2 xl:col-span-1">
          <Label htmlFor="dt">Travel date</Label>
          <Input
            id="dt"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="flex md:col-span-2 xl:col-span-1 md:pb-0.5">
          <Button
            type="button"
            className="h-11 w-full gap-2 rounded-xl md:min-w-[8rem]"
            disabled={loading || !canSubmit || !cities?.length}
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
