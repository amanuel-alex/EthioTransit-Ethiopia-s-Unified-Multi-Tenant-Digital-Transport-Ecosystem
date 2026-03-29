"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { useAuth } from "@/lib/auth/auth-context";

function AdminSettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const companyId = searchParams.get("company");

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Platform settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Fees, feature flags, and operator lifecycle controls.
      </p>
      <OperatorGlassCard className="mt-6 p-6">
        <p className="text-sm text-zinc-300">
          Global configuration will live here. Approve/suspend flows can extend
          the admin API when you are ready.
        </p>
        {companyId ? (
          <p className="mt-4 font-mono text-xs text-zinc-500">
            Selected operator id: {companyId}
          </p>
        ) : null}
      </OperatorGlassCard>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <AdminSettingsInner />
    </Suspense>
  );
}
