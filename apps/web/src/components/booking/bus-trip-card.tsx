"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScheduleDetail } from "@/lib/api/types";
import { routeShortLabel } from "@/lib/route-label";
import { cn } from "@/lib/utils";

/** Coach hero — sharp on retina & grid cells (`remotePatterns` → unsplash.com). */
const TRIP_CARD_IMAGE =
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85";

export type TripSearchHit = {
  detail: ScheduleDetail;
  companyName: string;
};

type Props = {
  trip: TripSearchHit;
  onSelectSeat: (scheduleId: string) => void;
  /** Kept for API compat; route is always shown on the hero for clarity. */
  showRoute?: boolean;
};

function fmtTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-ET", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BusTripCard({ trip, onSelectSeat }: Props) {
  const reduce = useReducedMotion();
  const { detail, companyName } = trip;
  const { schedule, availableSeats } = detail;
  const seatsLeft = availableSeats.length;
  const soldOut = seatsLeft === 0;
  const route = schedule.route;
  const routeLabel = routeShortLabel(route);
  const routeOriginDest = `${route.origin} → ${route.destination}`;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? false : { opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/90 shadow-md ring-1 ring-black/5 backdrop-blur-sm",
        "transition-[box-shadow,transform] duration-300 will-change-transform",
        "hover:shadow-xl hover:ring-primary/20",
        "dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-lg dark:shadow-black/50 dark:ring-white/10 dark:hover:ring-[hsl(152,65%,48%)]/25",
        soldOut && "opacity-90",
      )}
    >
      {/* Hero — bus image */}
      <div
        className={cn(
          "relative aspect-[5/3] w-full shrink-0 overflow-hidden bg-muted",
          soldOut && "grayscale-[0.35]",
        )}
      >
        <Image
          src={TRIP_CARD_IMAGE}
          alt={`Coach · ${routeLabel}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
          className={cn(
            "object-cover object-center",
            "[motion-reduce:transition-none] transition duration-700 ease-out",
            "group-hover:scale-[1.06]",
          )}
        />
        {/* Readability scrim + depth */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[hsl(152,65%,48%)]/10 via-transparent to-transparent opacity-80 mix-blend-soft-light"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 p-4 pt-10 sm:p-4 sm:pt-12">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-white/70">
            Route
          </p>
          <p className="mt-0.5 text-lg font-bold leading-snug tracking-tight text-white drop-shadow-md sm:text-xl">
            {routeLabel}
          </p>
          {routeLabel !== routeOriginDest ? (
            <p className="mt-1 text-xs font-medium text-white/75">
              {routeOriginDest}
            </p>
          ) : null}
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md",
              "shadow-sm",
            )}
          >
            <Bus className="h-3.5 w-3.5 text-[hsl(152,72%,58%)]" aria-hidden />
            {schedule.bus.plateNumber}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "max-w-full truncate border-0 bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary",
              "hover:bg-primary/15 dark:bg-[hsl(152,65%,48%)]/20 dark:text-[hsl(152,72%,58%)]",
            )}
          >
            {companyName}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-[hsl(152,65%,48%)]/15 dark:text-[hsl(152,72%,58%)]">
              <Clock className="h-4 w-4" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                Departure · Arrival
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                {fmtTime(schedule.departsAt)}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {fmtTime(schedule.arrivesAt)}
              </span>
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-3 dark:border-white/10">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              From
            </p>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {schedule.basePrice}
              <span className="ml-1 text-sm font-semibold text-muted-foreground">
                ETB
              </span>
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / seat
              </span>
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl bg-muted/80 px-3 py-2 text-sm font-medium dark:bg-white/5",
              seatsLeft <= 5 && seatsLeft > 0 && "text-amber-600 dark:text-amber-400",
            )}
          >
            <Users className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {soldOut ? (
              <span>Full</span>
            ) : (
              <span>
                <span className="font-bold tabular-nums">{seatsLeft}</span> left
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className={cn(
            "mt-auto h-11 w-full rounded-xl text-sm font-semibold shadow-md",
            "bg-[hsl(152,65%,48%)] text-zinc-950 hover:bg-[hsl(152,65%,44%)]",
            "dark:shadow-[0_0_24px_-4px_hsla(152,65%,48%,0.45)]",
            "transition-transform hover:scale-[1.01] active:scale-[0.99]",
          )}
          disabled={soldOut}
          onClick={() => onSelectSeat(schedule.id)}
        >
          {soldOut ? "Sold out" : "Select seat"}
        </Button>
      </div>
    </motion.article>
  );
}
