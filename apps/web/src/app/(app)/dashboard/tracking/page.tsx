"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function LiveTrackingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Live tracking</h1>
      <p className="mt-1 text-sm text-zinc-400">
        GPS map and active trip board for your fleet (coming soon).
      </p>
      <OperatorGlassCard className="mt-6 flex min-h-[240px] items-center justify-center p-6">
        <p className="text-center text-sm text-zinc-500">
          Connect telematics or driver apps to show positions here.
        </p>
      </OperatorGlassCard>
    </div>
  );
}
