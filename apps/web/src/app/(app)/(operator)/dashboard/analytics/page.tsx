"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { PeakHoursChart } from "@/components/dashboard/peak-hours-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

type RevenuePayload = {
  payments?: { gross?: string; companyEarnings?: string; platformFees?: string };
  profitByRoute?: { origin: string; destination: string; profit: unknown }[];
  peakBookingHours?: { hour: number; bookings: unknown }[];
  topBusesForCompany?: {
    plate: string;
    trips: number | bigint;
    revenue: unknown;
  }[];
  km?: {
    totalDistanceKm?: number;
    revenuePerKm?: number;
    costPerKm?: number;
  };
};

const PIE_COLORS = ["#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa"];

export default function OperatorAnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [revenue, setRevenue] = useState<RevenuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const r = await api.companyRevenue();
      setRevenue(r as RevenuePayload);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData =
    revenue?.profitByRoute?.map((row) => ({
      name: `${row.origin} → ${row.destination}`.slice(0, 28),
      profit: Number(row.profit),
    })) ?? [];

  const peakData =
    revenue?.peakBookingHours?.map((p) => ({
      hour: `${p.hour}:00`,
      bookings: Number(p.bookings),
    })) ?? [];

  const busData = useMemo(() => {
    const buses = revenue?.topBusesForCompany ?? [];
    return buses.map((b) => ({
      plate: b.plate,
      trips: Number(b.trips),
      revenue: Number(b.revenue),
    }));
  }, [revenue?.topBusesForCompany]);

  const splitPie = useMemo(() => {
    const gross = parseFloat(revenue?.payments?.gross ?? "0");
    const platform = parseFloat(revenue?.payments?.platformFees ?? "0");
    const company = parseFloat(revenue?.payments?.companyEarnings ?? "0");
    if (!gross && !platform && !company) {
      return [
        { name: "Platform 7%", value: 7 },
        { name: "Company 93%", value: 93 },
      ];
    }
    return [
      { name: "Platform fees", value: platform || 0.01 },
      { name: "Company earnings", value: company || 0.01 },
    ];
  }, [revenue?.payments]);

  const km = revenue?.km;

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Profitable routes, peaks, bus ranking, and per-km economics.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/15 bg-white/5 text-zinc-200"
        >
          <Link href="/dashboard">Overview</Link>
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full bg-white/10" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <OperatorGlassCard className="p-4 lg:col-span-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Revenue split
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={splitPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      label
                    >
                      {splitPie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]!}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </OperatorGlassCard>
            <OperatorGlassCard className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Per km (paid trips)
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Distance</dt>
                  <dd className="text-white tabular-nums">
                    {km?.totalDistanceKm?.toFixed?.(1) ?? km?.totalDistanceKm ?? "—"}{" "}
                    km
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Revenue / km</dt>
                  <dd className="text-emerald-300 tabular-nums">
                    {km?.revenuePerKm != null
                      ? Number(km.revenuePerKm).toFixed(2)
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Cost / km</dt>
                  <dd className="text-amber-200 tabular-nums">
                    {km?.costPerKm != null
                      ? Number(km.costPerKm).toFixed(2)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </OperatorGlassCard>
          </div>

          <RevenueChart data={chartData} />
          <PeakHoursChart data={peakData} />

          <OperatorGlassCard className="p-4">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Bus performance (ranked by revenue)
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="plate" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(152,65%,45%)" radius={[6, 6, 0, 0]} name="Revenue ETB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OperatorGlassCard>

          <OperatorGlassCard className="p-4">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Trips per bus
            </p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={busData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="plate" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Line type="monotone" dataKey="trips" stroke="#60a5fa" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </OperatorGlassCard>
        </div>
      )}
    </div>
  );
}
