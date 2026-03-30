"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Exports for finance, fuel, and compliance.
      </p>
      <OperatorGlassCard className="mt-6 p-6">
        <p className="text-sm text-zinc-400">
          Scheduled CSV/PDF exports and custom date ranges will be configured
          here.
        </p>
      </OperatorGlassCard>
    </div>
  );
}
