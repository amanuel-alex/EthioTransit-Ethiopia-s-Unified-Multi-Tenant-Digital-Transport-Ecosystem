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
import { getApiBaseUrl } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function fmtEtb(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(v);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") {
      router.replace("/home");
    }
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
      toast.error(err.message ?? "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueBarData = useMemo(() => {
    const rows = analytics?.paymentVolumeByDay as
      | { label: string; gross: unknown }[]
      | undefined;
    if (!rows?.length) return [];
    return rows.map((r) => ({
      label: r.label,
      gross: Number(r.gross) || 0,
    }));
  }, [analytics?.paymentVolumeByDay]);

  const maxRevenueBar = useMemo(
    () => revenueBarData.reduce((m, d) => Math.max(m, d.gross), 0),
    [revenueBarData],
  );

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
      .slice(0, 6);
  }, [analytics?.revenuePerCompany]);

  const paymentTotals = analytics?.paymentTotals as
    | { gross?: string; platformFees?: string }
    | undefined;

  const operatorsMeta = analytics?.operators as
    | { total?: number; active?: number; suspended?: number }
    | undefined;

  const km = analytics?.km as
    | {
        totalDistanceKm?: number;
        totalCompanyEarning?: number;
        revenuePerKm?: number;
      }
    | undefined;

  if (user?.role !== "ADMIN") {
    return null;
  }

  let apiHealthOrigin: string | null = null;
  try {
    apiHealthOrigin = getApiBaseUrl();
  } catch {
    apiHealthOrigin = null;
  }

  const totalGross = paymentTotals?.gross
    ? parseFloat(paymentTotals.gross)
    : 0;
  const commission = paymentTotals?.platformFees
    ? parseFloat(paymentTotals.platformFees)
    : 0;

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
              System{" "}
              <span className="text-[hsl(152,65%,48%)]">Analytics</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Real-time performance monitoring across the transit network.
            </p>
          </div>
          {apiHealthOrigin ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <a
                href={`${apiHealthOrigin}/api/v1/health`}
                target="_blank"
                rel="noreferrer"
              >
                API health
              </a>
            </Button>
          ) : null}
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full bg-white/10" />
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <OperatorGlassCard className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total revenue (completed payments)
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {fmtEtb(totalGross)}{" "}
                  <span className="text-sm font-normal text-zinc-500">ETB</span>
                </p>
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  Gross volume settled through the platform
                </p>
              </OperatorGlassCard>
              <OperatorGlassCard className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Commission earned
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {fmtEtb(commission)}{" "}
                  <span className="text-sm font-normal text-zinc-500">ETB</span>
                </p>
                <p className="mt-2 text-xs font-medium text-amber-200">
                  Platform fees (completed)
                </p>
              </OperatorGlassCard>
              <OperatorGlassCard className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Operators
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {operatorsMeta?.active ?? "—"}
                  <span className="text-base font-normal text-zinc-500">
                    {" "}
                    active
                  </span>
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {operatorsMeta?.total ?? "—"} registered ·{" "}
                  {operatorsMeta?.suspended ?? 0} suspended
                </p>
              </OperatorGlassCard>
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-5">
              <OperatorGlassCard className="p-4 lg:col-span-3">
                <p className="text-sm font-semibold text-white">
                  Revenue momentum
                </p>
                <p className="text-xs text-zinc-500">
                  Completed payment gross by day (UTC), last 7 days
                </p>
                <div className="mt-4 h-56 w-full">
                  {revenueBarData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueBarData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#a1a1aa", fontSize: 10 }}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={48}
                        />
                        <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} width={36} />
                        <Tooltip
                          formatter={(value: number | string) => [
                            `${fmtEtb(Number(value))} ETB`,
                            "Gross",
                          ]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "#141414",
                            color: "#fafafa",
                          }}
                        />
                        <Bar dataKey="gross" radius={[6, 6, 0, 0]} name="Gross ETB">
                          {revenueBarData.map((entry) => (
                            <Cell
                              key={entry.label}
                              fill={
                                entry.gross === maxRevenueBar && maxRevenueBar > 0
                                  ? "hsl(152, 65%, 48%)"
                                  : "rgba(255,255,255,0.12)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-8 text-center text-sm text-zinc-500">
                      No daily payment data yet.
                    </p>
                  )}
                </div>
              </OperatorGlassCard>

              <OperatorGlassCard className="p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-white">
                  Operator share
                </p>
                <p className="text-xs text-zinc-500">By completed payment volume</p>
                <ul className="mt-4 space-y-4">
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
                    <li className="text-sm text-zinc-500">No revenue data yet.</li>
                  )}
                </ul>
                <p className="mt-4 text-xs text-zinc-500">
                  Paid distance: {km?.totalDistanceKm?.toFixed?.(0) ?? "—"} km ·
                  Operator earnings: {fmtEtb(km?.totalCompanyEarning ?? 0)} ETB
                </p>
              </OperatorGlassCard>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  href: "/admin/operator-applications",
                  title: "Applications",
                  body: "Review self-serve operator signups",
                },
                { href: "/admin/companies", title: "Companies", body: "Activate or suspend operators" },
                { href: "/admin/users", title: "Users", body: "Passengers, company accounts, admins" },
                { href: "/admin/bookings", title: "Bookings", body: "Cross-tenant reservations" },
                { href: "/admin/analytics", title: "Analytics", body: "Peak times & operator share" },
                { href: "/admin/revenue", title: "Revenue", body: "Commission & payouts view" },
                { href: "/admin/settings", title: "Settings", body: "Platform configuration" },
              ].map((card) => (
                <Link key={card.href} href={card.href}>
                  <OperatorGlassCard className="h-full p-5 transition-colors hover:border-[hsl(152,65%,48%)]/40">
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">{card.body}</p>
                  </OperatorGlassCard>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
