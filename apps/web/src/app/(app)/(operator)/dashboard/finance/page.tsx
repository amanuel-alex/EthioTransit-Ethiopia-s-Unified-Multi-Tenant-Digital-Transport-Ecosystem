"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { PLATFORM_FEE_RATE } from "@/lib/constants/commission";

function fmt(n: string | number | undefined) {
  if (n === undefined) return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(
    v,
  );
}

export default function OperatorFinancePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const f = await api.companyFinance();
      setData(f);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load finance");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "COMPANY") return null;

  const payments = data?.payments as
    | Record<string, unknown>
    | undefined;
  const op = data?.operational as Record<string, unknown> | undefined;
  const pctPlatform = Math.round(Number(PLATFORM_FEE_RATE) * 100);
  const pctCompany = 100 - pctPlatform;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Finance</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Commission split ({pctPlatform}% platform · {pctCompany}% company),
        estimated operating costs, salaries, and net profit estimate.
      </p>

      {loading || !data ? (
        <Skeleton className="mt-6 h-64 w-full bg-white/10" />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <OperatorGlassCard className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Payments (completed)
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Gross</dt>
                <dd className="tabular-nums text-white">
                  {fmt(payments?.gross as string)} ETB
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Platform fees ({pctPlatform}%)</dt>
                <dd className="tabular-nums text-amber-200">
                  {fmt(payments?.platformFees as string)} ETB
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Company earnings ({pctCompany}%)</dt>
                <dd className="tabular-nums text-emerald-300">
                  {fmt(payments?.companyEarnings as string)} ETB
                </dd>
              </div>
            </dl>
          </OperatorGlassCard>

          <OperatorGlassCard className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Costs & profit
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Est. fuel / per-km cost</dt>
                <dd className="tabular-nums text-zinc-200">
                  {fmt(op?.estimatedFuelAndPerKmCost as string)} ETB
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Total salaries</dt>
                <dd className="tabular-nums text-zinc-200">
                  {fmt(op?.totalSalaries as string)} ETB
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Distance (paid trips)</dt>
                <dd className="tabular-nums text-white">
                  {fmt(op?.totalDistanceKm as number)} km
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Revenue / km</dt>
                <dd className="tabular-nums text-emerald-300">
                  {fmt(op?.revenuePerKm as number)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Cost / km</dt>
                <dd className="tabular-nums text-amber-200">
                  {fmt(op?.costPerKm as number)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="font-medium text-white">Net profit (estimate)</dt>
                <dd className="tabular-nums text-lg font-semibold text-[hsl(152,65%,52%)]">
                  {fmt(data?.netProfitEstimate as string)} ETB
                </dd>
              </div>
            </dl>
          </OperatorGlassCard>
        </div>
      )}
    </div>
  );
}
