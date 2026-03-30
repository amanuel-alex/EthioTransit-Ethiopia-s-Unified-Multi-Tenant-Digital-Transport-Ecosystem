"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function TeamPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Team</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Drivers, dispatchers, and roles for your operator account.
      </p>
      <OperatorGlassCard className="mt-6 p-6">
        <p className="text-sm text-zinc-400">
          Staff management UI will list company users and invite flows when the
          API exposes them.
        </p>
      </OperatorGlassCard>
    </div>
  );
}
