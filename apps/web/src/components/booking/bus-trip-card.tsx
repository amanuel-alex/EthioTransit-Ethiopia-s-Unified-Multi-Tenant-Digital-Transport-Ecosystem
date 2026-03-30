"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bus, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScheduleDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type TripSearchHit = {
  detail: ScheduleDetail;
  companyName: string;
};

type Props = {
  trip: TripSearchHit;
  onSelectSeat: (scheduleId: string) => void;
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

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={reduce ? false : { opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "rounded-xl border border-border/60 bg-card/80 shadow-md backdrop-blur-sm",
        "dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-lg dark:shadow-black/40",
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/15 font-semibold text-primary hover:bg-primary/15">
              {companyName}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bus className="h-3.5 w-3.5" aria-hidden />
              {schedule.bus.plateNumber}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              {fmtTime(schedule.departsAt)}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-foreground">{fmtTime(schedule.arrivesAt)}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {schedule.basePrice}
              </span>{" "}
              ETB <span className="text-xs">/ seat</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {seatsLeft} seats left
            </span>
          </div>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-12 shrink-0 rounded-xl px-8 shadow-md transition-transform hover:scale-[1.02]"
          disabled={seatsLeft === 0}
          onClick={() => onSelectSeat(schedule.id)}
        >
          Select seat
        </Button>
      </div>
    </motion.article>
  );
}
