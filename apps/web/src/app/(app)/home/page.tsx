"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/lib/auth/auth-context";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (user?.role === "COMPANY") router.replace("/dashboard");
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [user?.role, router]);

  if (user?.role !== "PASSENGER") {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Your journey starts here"
        description="Search live schedules, pick seats, and pay with M-Pesa or Chapa."
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <GlassCard className="flex flex-col justify-between p-8">
          <div>
            <Search className="mb-4 h-10 w-10 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">Find a bus</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Compare operators on your corridor with real-time availability.
            </p>
          </div>
          <Button asChild className="mt-6 gap-2 self-start" size="lg">
            <Link href="/search">
              Open search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </GlassCard>
        <GlassCard className="flex flex-col justify-between p-8">
          <div>
            <Bus className="mb-4 h-10 w-10 text-accent" aria-hidden />
            <h2 className="text-xl font-semibold">My bookings</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              View upcoming trips, tickets, and cancellation options.
            </p>
          </div>
          <Button asChild variant="secondary" className="mt-6 self-start" size="lg">
            <Link href="/bookings">View bookings</Link>
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
