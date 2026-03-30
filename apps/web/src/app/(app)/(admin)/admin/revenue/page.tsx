"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

function fmt(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(v);
}

export default function AdminRevenuePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const a = await api.adminAnalytics();
      setData(a);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load revenue");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "ADMIN") return null;

  const pt = data?.paymentTotals as
    | { gross?: string; platformFees?: string; companyEarnings?: string }
    | undefined;
  const revRows = data?.revenuePerCompany as
    | { name: string; revenue: unknown }[]
    | undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Completed payment totals and commission split.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 bg-white/5">
          <Link href="/admin">Overview</Link>
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full bg-white/10" />
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <OperatorGlassCard className="p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Gross</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {fmt(pt?.gross ?? 0)} <span className="text-sm text-zinc-500">ETB</span>
              </p>
            </OperatorGlassCard>
            <OperatorGlassCard className="p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Platform fees</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-200">
                {fmt(pt?.platformFees ?? 0)}{" "}
                <span className="text-sm text-zinc-500">ETB</span>
              </p>
            </OperatorGlassCard>
            <OperatorGlassCard className="p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">To operators</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-300">
                {fmt(pt?.companyEarnings ?? 0)}{" "}
                <span className="text-sm text-zinc-500">ETB</span>
              </p>
            </OperatorGlassCard>
          </div>

          <OperatorGlassCard className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-semibold text-white">Volume by company</h2>
              <p className="text-xs text-zinc-500">From completed payments</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Operator</TableHead>
                  <TableHead className="text-right text-zinc-400">Revenue (ETB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(revRows ?? []).map((r) => (
                  <TableRow key={r.name} className="border-white/5">
                    <TableCell className="font-medium text-zinc-100">
                      {r.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-300">
                      {fmt(Number(r.revenue))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </OperatorGlassCard>
        </>
      )}
    </div>
  );
}
