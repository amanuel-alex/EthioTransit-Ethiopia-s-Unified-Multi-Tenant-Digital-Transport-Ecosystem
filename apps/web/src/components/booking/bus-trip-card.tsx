"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScheduleDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Shared thumb for trip rows (Next `remotePatterns` includes unsplash.com). */
const TRIP_CARD_IMAGE =
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=75";

export type TripSearchHit = {
  detail: ScheduleDetail;
  companyName: string;
};

type Props = {
  trip: TripSearchHit;
  onSelectSeat: (scheduleId: string) => void;
  /** When true, show route origin → destination under the operator name. */
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

export function BusTripCard({ trip, onSelectSeat, showRoute }: Props) {
  const reduce = useReducedMotion();
  const { detail, companyName } = trip;
  const { schedule, availableSeats } = detail;
  const seatsLeft = availableSeats.length;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={reduce ? false : { opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { scale: 1.005 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm",
        "dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-md dark:shadow-black/30",
      )}
    >
      <div className="grid min-h-[5.5rem] flex-1 grid-cols-[1fr_4.75rem] items-stretch sm:grid-cols-[1fr_6.25rem]">
        <div className="flex min-w-0 flex-col justify-center gap-2 p-3 sm:gap-2 sm:p-4 sm:pr-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Badge className="bg-primary/15 px-2 py-0 text-xs font-semibold text-primary hover:bg-primary/15">
              {companyName}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bus className="h-3 w-3" aria-hidden />
              {schedule.bus.plateNumber}
            </span>
          </div>
          {showRoute ? (
            <p className="text-sm font-semibold leading-snug tracking-tight text-foreground">
              {schedule.route.origin}{" "}
              <span className="font-normal text-muted-foreground">→</span>{" "}
              {schedule.route.destination}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {fmtTime(schedule.departsAt)}
              <ArrowRight
                className="h-3 w-3 shrink-0 opacity-60"
                aria-hidden
              />
              {fmtTime(schedule.arrivesAt)}
            </span>
            <span>
              <span className="font-semibold text-foreground">
                {schedule.basePrice}
              </span>{" "}
              ETB
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {seatsLeft} left
            </span>
          </div>
          <div className="pt-0.5">
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg px-5 text-xs font-semibold shadow-sm sm:text-sm"
              disabled={seatsLeft === 0}
              onClick={() => onSelectSeat(schedule.id)}
            >
              Select seat
            </Button>
          </div>
        </div>

        <div className="relative min-h-[5rem] border-l border-border/40 dark:border-white/10 sm:min-h-[5.5rem]">
          <Image
            src={TRIP_CARD_IMAGE}
            alt=""
            fill
            sizes="100px"
            className="object-cover [motion-reduce:transition-none] transition duration-300 group-hover:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-zinc-950/20 dark:to-zinc-950/35"
            aria-hidden
          />
        </div>
      </div>
    </motion.article>
  );
}
