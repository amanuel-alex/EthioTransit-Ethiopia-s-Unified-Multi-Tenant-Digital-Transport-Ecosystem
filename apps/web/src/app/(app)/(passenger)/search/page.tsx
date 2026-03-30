"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteResultCard } from "@/components/booking/route-result-card";
import { ScheduleCard } from "@/components/booking/schedule-card";
import { PageHeader } from "@/components/shared/page-header";
import { useApi } from "@/lib/api/hooks";
import type { RouteSearchRow, ScheduleDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { localDayRangeToIso } from "@/lib/date-range";
import { getOperatorPresets } from "@/lib/operators";
import { useTenant } from "@/lib/tenant/tenant-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const { user, logout } = useAuth();
  const { companyId, setCompanyId } = useTenant();
  const presets = getOperatorPresets();

  const [origin, setOrigin] = useState(searchParams.get("origin") ?? "");
  const [destination, setDestination] = useState(
    searchParams.get("destination") ?? "",
  );
  const [date, setDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
  );
  const [routes, setRoutes] = useState<RouteSearchRow[] | null>(null);
  const [schedules, setSchedules] = useState<ScheduleDetail[] | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteSearchRow | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [customOp, setCustomOp] = useState("");

  const tenantMissing = user?.role === "PASSENGER" && !companyId;
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      toast.error("Enter origin and destination");
      return;
    }
    if (user?.role === "PASSENGER" && !companyId) {
      toast.error("Choose an operator first");
      return;
    }
    setLoading(true);
    setRoutes(null);
    setSchedules(null);
    setSelectedRoute(null);
    try {
      const { data } = await api.searchRoutes(
        origin.trim(),
        destination.trim(),
      );
      setRoutes(data);
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
      toast.error(err.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }, [api, origin, destination, date, router, user?.role, companyId, logout]);

  useEffect(() => {
    if (initialSearchDone.current || tenantMissing) return;
    const o = searchParams.get("origin")?.trim();
    const d = searchParams.get("destination")?.trim();
    if (!o || !d) return;
    initialSearchDone.current = true;
    setOrigin(o);
    setDestination(d);
    const dt = searchParams.get("date");
    if (dt) setDate(dt);
    void (async () => {
      setLoading(true);
      setRoutes(null);
      setSchedules(null);
      setSelectedRoute(null);
      try {
        const { data } = await api.searchRoutes(o, d);
        setRoutes(data);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          router.push("/auth");
          return;
        }
        toast.error(err.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, tenantMissing, api, logout, router]);

  const loadSchedules = async (route: RouteSearchRow) => {
    setSelectedRoute(route);
    setLoading(true);
    setSchedules(null);
    try {
      const { from, to } = localDayRangeToIso(date);
      const { data } = await api.schedulesByRoute(route.id, from, to);
      setSchedules(data);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Could not load schedules");
    } finally {
      setLoading(false);
    }
  };

  const pickSchedule = (scheduleId: string) => {
    router.push(`/seat?scheduleId=${encodeURIComponent(scheduleId)}`);
  };

  return (
    <div>
      <PageHeader
        title="Search routes"
        description="Pick a route, then choose a departure that fits your plan."
      />

      {tenantMissing ? (
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium">Select an operator</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Passenger searches need{" "}
                <code className="rounded bg-muted px-1">x-company-id</code>.
                Choose from your configured list or enter a company ID, then
                search again from the{" "}
                <Link href="/" className="text-primary underline">
                  home page
                </Link>
                .
              </p>
            </div>
          </div>
          {presets.length > 0 ? (
            <div className="max-w-sm space-y-2">
              <Label>Operator</Label>
              <Select
                onValueChange={(v) => {
                  setCompanyId(v);
                  toast.success("Operator saved");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose operator" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="max-w-md space-y-2">
            <Label htmlFor="cid">Company ID</Label>
            <div className="flex gap-2">
              <Input
                id="cid"
                placeholder="Paste UUID from seed / Prisma"
                value={customOp}
                onChange={(e) => setCustomOp(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  const v = customOp.trim();
                  if (!v) return;
                  setCompanyId(v);
                  toast.success("Operator saved");
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-4">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="o">Origin</Label>
          <Input
            id="o"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="d">Destination</Label>
          <Input
            id="d"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="dt">Date</Label>
          <Input
            id="dt"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="w-full"
            disabled={loading || !!tenantMissing}
            onClick={() => void runSearch()}
          >
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </div>

      {loading && !routes && !schedules ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {routes && !selectedRoute ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Routes</h2>
          {routes.length === 0 ? (
            <p className="text-muted-foreground">No routes found.</p>
          ) : (
            routes.map((r) => (
              <RouteResultCard
                key={r.id}
                route={r}
                onSelect={() => void loadSchedules(r)}
              />
            ))
          )}
        </div>
      ) : null}

      {selectedRoute && schedules ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Schedules — {selectedRoute.origin} → {selectedRoute.destination}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRoute(null);
                setSchedules(null);
              }}
            >
              Back to routes
            </Button>
          </div>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground">No departures that day.</p>
          ) : (
            <div className="space-y-4">
              {schedules.map((s) => (
                <ScheduleCard
                  key={s.schedule.id}
                  detail={s}
                  onSelect={pickSchedule}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
