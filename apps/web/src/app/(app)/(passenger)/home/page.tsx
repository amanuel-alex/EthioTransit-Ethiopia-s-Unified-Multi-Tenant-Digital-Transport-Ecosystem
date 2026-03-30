"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function HubCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/50 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/5 backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
    <div className="relative">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="mb-10 space-y-3 sm:mb-12"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.65rem] md:leading-tight">
          Your journey starts{" "}
          <span className="text-[hsl(152,65%,52%)]">here</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Search live schedules, pick seats, and pay with M-Pesa or Chapa.
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.04 }}
        className="grid gap-5 md:grid-cols-2 md:gap-6"
      >
        <HubCard>
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[hsl(152,65%,48%)]/35 bg-[hsl(152,65%,48%)]/10">
              <Search
                className="h-8 w-8 text-[hsl(152,65%,52%)]"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Find a bus
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Compare operators on your corridor with real-time availability.
            </p>
          </div>
          <Button
            asChild
            className="mt-8 h-12 gap-2 rounded-xl bg-[hsl(152,65%,48%)] px-6 text-base font-semibold text-zinc-950 shadow-[0_0_28px_hsla(152,65%,48%,0.35)] hover:bg-[hsl(152,65%,44%)]"
            size="lg"
          >
            <Link href="/search">
              Open search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </HubCard>

        <HubCard>
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10">
              <Bus
                className="h-8 w-8 text-amber-400"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              My bookings
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              View upcoming trips, tickets, and cancellation options.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-8 h-12 self-start rounded-xl border-white/15 bg-white/5 px-6 text-base font-semibold text-zinc-100 hover:bg-white/10 hover:text-white"
            size="lg"
          >
            <Link href="/bookings">View bookings</Link>
          </Button>
        </HubCard>
      </motion.div>
    </div>
  );
}
