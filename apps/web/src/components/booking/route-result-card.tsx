"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import type { RouteSearchRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Props = {
  route: RouteSearchRow;
  onSelect: (route: RouteSearchRow) => void;
  selected?: boolean;
};

export function RouteResultCard({ route, onSelect, selected }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <GlassCard
        className={cn(
          "p-5 transition-colors",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{route.company.name}</Badge>
              <span className="text-xs text-muted-foreground">
                {route.distanceKm} km
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-lg font-medium">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              {route.origin}
              <Route className="mx-1 h-4 w-4 text-muted-foreground" aria-hidden />
              {route.destination}
            </div>
          </div>
          <Button type="button" onClick={() => onSelect(route)}>
            View schedules
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
