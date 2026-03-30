"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  Banknote,
  Download,
  Route,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/api/hooks";
import type { BookingRow, CompanyDashboardStats } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

type RevenuePayload = {
  payments?: {
    gross?: string;
    companyEarnings?: string;
  };
  profitByRoute?: {
    origin: string;
    destination: string;
    profit: unknown;
  }[];
  peakBookingHours?: { hour: number; bookings: unknown }[];
  topBusesForCompany?: { trips: bigint | number; plate: string }[];
};

function fmtEtb(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtMoneyCell(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return `${v} ETB`;
  if (typeof v === "number") return `${fmtEtb(v)} ETB`;
  if (typeof v === "object" && v !== null && "toString" in v) {
    return `${String((v as { toString: () => string }).toString())} ETB`;
  }
  return String(v);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePayload | null>(null);
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") {
      router.replace("/home");
    }
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const [d, r, b] = await Promise.all([
        api.companyDashboard(),
        api.companyRevenue(),
        api.listCompanyBookings(),
      ]);
      setStats(d);
      setRevenue(r as RevenuePayload);
      setBookings(b.data);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(() => {
    const peak = revenue?.peakBookingHours ?? [];
    if (!peak.length) return [];
    const byHour = new Map<number, number>();
    for (const p of peak) {
      byHour.set(p.hour, Number(p.bookings));
    }
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      bookings: byHour.get(hour) ?? 0,
    }));
  }, [revenue?.peakBookingHours]);

  const topRoutes = useMemo(() => {
    const rows = revenue?.profitByRoute ?? [];
    return [...rows]
      .map((row) => ({
        label: `${row.origin} → ${row.destination}`,
        profit: Number(row.profit),
      }))
      .filter((r) => !Number.isNaN(r.profit))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [revenue?.profitByRoute]);

  const busTripsTotal = useMemo(() => {
    const buses = revenue?.topBusesForCompany ?? [];
    return buses.reduce((acc, b) => acc + Number(b.trips), 0);
  }, [revenue?.topBusesForCompany]);

  const recentRows = useMemo(
    () => (bookings ?? []).slice(0, 8),
    [bookings],
  );

  if (user?.role !== "COMPANY") {
    return null;
  }

  const grossDisplay = stats
    ? fmtEtb(stats.revenueCompleted.companyEarnings)
    : "—";

  return (
    <div className="relative min-h-[60vh]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.35) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Fleet overview
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Real-time logistics and revenue performance for your operator.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            System status: Operational
          </div>
        </div>

        {loading || !stats ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full bg-white/10" />
            <Skeleton className="h-72 w-full bg-white/10" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <OperatorGlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Total revenue (completed)
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                      {grossDisplay}{" "}
                      <span className="text-sm font-normal text-zinc-500">
                        ETB
                      </span>
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Company earnings after fees
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
                    <Banknote className="h-5 w-5" />
                  </div>
                </div>
              </OperatorGlassCard>

              <OperatorGlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Trip volume
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                      {busTripsTotal}{" "}
                      <span className="text-base font-normal text-zinc-500">
                        paid trips
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {stats.bookingsToday} bookings today ·{" "}
                      {stats.pendingBookings} awaiting payment
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
                    <Route className="h-5 w-5" />
                  </div>
                </div>
              </OperatorGlassCard>

              <OperatorGlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Fleet & compliance
                    </p>
                    <p className="mt-2 text-lg font-semibold text-amber-200">
                      Review schedules
                    </p>
                    <Link
                      href="/dashboard/fleet"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      Fleet management
                      <ArrowDownRight className="h-3 w-3 rotate-[-90deg]" />
                    </Link>
                  </div>
                  <div className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </OperatorGlassCard>
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-5">
              <OperatorGlassCard className="p-4 lg:col-span-3">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Booking activity
                    </p>
                    <p className="text-xs text-zinc-500">
                      Network peak hours (all operators) — your demand curve
                    </p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="opFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(152, 65%, 45%)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="hsl(152, 65%, 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="hour" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} width={32} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "#141414",
                            color: "#fafafa",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="bookings"
                          stroke="hsl(152, 65%, 48%)"
                          strokeWidth={2}
                          fill="url(#opFill)"
                          name="Bookings"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="flex h-full items-center justify-center text-sm text-zinc-500">
                      No hourly booking data yet.
                    </p>
                  )}
                </div>
              </OperatorGlassCard>

              <OperatorGlassCard className="flex flex-col p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-white">Top routes</p>
                <p className="text-xs text-zinc-500">By estimated profit (ETB)</p>
                <ul className="mt-4 flex flex-1 flex-col gap-3">
                  {topRoutes.length ? (
                    topRoutes.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="truncate text-sm text-zinc-200">
                          {r.label}
                        </span>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-400">
                          {fmtEtb(r.profit)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-zinc-500">No route data yet.</li>
                  )}
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 border-white/10 bg-transparent text-zinc-200 hover:bg-white/5"
                >
                  <Link href="/dashboard/revenue">Revenue detail</Link>
                </Button>
              </OperatorGlassCard>
            </div>

            <OperatorGlassCard className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-white">Recent transactions</h2>
                  <p className="text-xs text-zinc-500">
                    Latest bookings for your fleet
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  asChild
                >
                  <Link href="/bookings">
                    <Download className="mr-2 h-4 w-4" />
                    View all
                  </Link>
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Transaction</TableHead>
                    <TableHead className="text-zinc-400">Passenger / fleet</TableHead>
                    <TableHead className="text-zinc-400">Route</TableHead>
                    <TableHead className="text-right text-zinc-400">Amount</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {row.id.slice(0, 12)}…
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300">
                            {(row.user?.phone ?? "?").slice(-2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-zinc-200">
                              {row.user?.phone ?? "Passenger"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {row.schedule.bus.plateNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-300">
                        {row.schedule.route.origin} →{" "}
                        {row.schedule.route.destination}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-zinc-200">
                        {fmtMoneyCell(row.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-0 font-semibold uppercase tracking-wide",
                            row.status === "PAID" &&
                              "bg-emerald-500/20 text-emerald-300",
                            row.status === "PENDING" &&
                              "bg-amber-500/20 text-amber-200",
                            row.status === "CANCELLED" &&
                              "bg-red-500/20 text-red-300",
                          )}
                          variant="secondary"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!recentRows.length ? (
                <p className="px-5 py-8 text-center text-sm text-zinc-500">
                  No bookings yet.
                </p>
              ) : null}
            </OperatorGlassCard>
          </>
        )}
      </div>
    </div>
  );
}
