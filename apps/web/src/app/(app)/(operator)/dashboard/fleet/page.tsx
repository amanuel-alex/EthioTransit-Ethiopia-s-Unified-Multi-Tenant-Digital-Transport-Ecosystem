"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function FleetManagementPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Fleet management</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Register buses, assign plates, and manage capacity. API hooks for full
        CRUD will land here.
      </p>
      <OperatorGlassCard className="mt-6 p-6">
        <p className="text-sm text-zinc-300">
          This screen is reserved for operator fleet CRUD (buses, maintenance
          windows, documents). Today, use search and schedules to run trips.
        </p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/search">Open schedules</Link>
        </Button>
      </OperatorGlassCard>
    </div>
  );
}
