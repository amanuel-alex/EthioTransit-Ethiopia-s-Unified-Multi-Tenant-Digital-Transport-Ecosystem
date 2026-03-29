"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Bus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import type { ScheduleDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Props = {
  detail: ScheduleDetail;
  onSelect: (scheduleId: string) => void;
};

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-ET", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ScheduleCard({ detail, onSelect }: Props) {
  const reduce = useReducedMotion();
  const { schedule, availableSeats } = detail;
  return (
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" aria-hidden />
              <span>{fmt(schedule.departsAt)}</span>
              <span aria-hidden>→</span>
              <span>{fmt(schedule.arrivesAt)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Bus className="h-4 w-4 text-primary" aria-hidden />
              <span className="font-medium">{schedule.bus.plateNumber}</span>
              <Badge variant="outline">{availableSeats.length} seats free</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              From{" "}
              <span className="font-medium text-foreground">
                {schedule.basePrice}
              </span>{" "}
              ETB / seat
            </p>
          </div>
          <Button
            type="button"
            disabled={availableSeats.length === 0}
            className={cn(availableSeats.length === 0 && "opacity-60")}
            onClick={() => onSelect(schedule.id)}
          >
            Pick seats
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
