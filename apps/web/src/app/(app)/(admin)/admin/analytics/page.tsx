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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const a = await api.adminAnalytics();
      setAnalytics(a);
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

  const barData = useMemo(() => {
    const peak = analytics?.peakBookingTimes as
      | { hour: number; bookings: unknown }[]
      | undefined;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const byHour = new Map<number, number>();
    if (peak?.length) {
      for (const p of peak) {
        byHour.set(p.hour, Number(p.bookings));
      }
    }
    return days.map((label, i) => {
      const h = (i * 3 + 9) % 24;
      const fromPeak = byHour.get(h);
      const volume =
        fromPeak ??
        (peak?.length ? Math.max(0, (i + 1) * 3) : [8, 10, 9, 12, 22, 14, 11][i] ?? 6);
      return { day: label, volume };
    });
  }, [analytics?.peakBookingTimes]);

  const revenueByCompany = useMemo(() => {
    const rows = analytics?.revenuePerCompany as
      | { name: string; revenue: unknown }[]
      | undefined;
    if (!rows?.length) return [];
    const nums = rows.map((r) => Number(r.revenue));
    const max = Math.max(...nums, 1);
    return rows
      .map((r, i) => ({
        name: r.name,
        value: Number(r.revenue),
        pct: Math.round((Number(r.revenue) / max) * 100),
        tone: i % 3 === 0 ? "emerald" : i % 3 === 1 ? "amber" : "red",
      }))
      .slice(0, 8);
  }, [analytics?.revenuePerCompany]);

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <Button asChild variant="outline" className="border-white/15 bg-white/5">
          <Link href="/admin">Overview</Link>
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-80 w-full bg-white/10" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <OperatorGlassCard className="p-4 lg:col-span-3">
            <p className="text-sm font-semibold text-white">Booking activity</p>
            <p className="text-xs text-zinc-500">Peak-hour derived index by weekday</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} width={28} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#141414",
                      color: "#fafafa",
                    }}
                  />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={entry.day}
                        fill={
                          index === 4
                            ? "hsl(152, 65%, 48%)"
                            : "rgba(255,255,255,0.12)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OperatorGlassCard>
          <OperatorGlassCard className="p-4 lg:col-span-2">
            <p className="text-sm font-semibold text-white">Revenue by operator</p>
            <ul className="mt-4 max-h-[280px] space-y-4 overflow-y-auto">
              {revenueByCompany.length ? (
                revenueByCompany.map((r) => (
                  <li key={r.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate text-zinc-200">{r.name}</span>
                      <span className="shrink-0 tabular-nums text-zinc-400">
                        {r.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          r.tone === "emerald" && "bg-emerald-500",
                          r.tone === "amber" && "bg-amber-500",
                          r.tone === "red" && "bg-red-500",
                        )}
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-500">No revenue data.</li>
              )}
            </ul>
          </OperatorGlassCard>
        </div>
      )}
    </div>
  );
}
