"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PeakHoursChart } from "@/components/dashboard/peak-hours-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

type RevenuePayload = {
  profitByRoute?: { origin: string; destination: string; profit: unknown }[];
  peakBookingHours?: { hour: number; bookings: unknown }[];
};

export default function OperatorRevenuePage() {
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
      toast.error(err.message ?? "Failed to load revenue");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "COMPANY") return null;

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Route profitability and booking peaks.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/15 bg-white/5 text-zinc-200"
        >
          <Link href="/dashboard">← Fleet overview</Link>
        </Button>
      </div>
      {loading ? (
        <Skeleton className="h-72 w-full bg-white/10" />
      ) : (
        <div className="space-y-6">
          <RevenueChart data={chartData} />
          <PeakHoursChart data={peakData} />
        </div>
      )}
    </div>
  );
}
