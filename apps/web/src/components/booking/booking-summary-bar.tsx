"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  seatCount: number;
  unitPrice: string;
  currency?: string;
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function BookingSummaryBar({
  seatCount,
  unitPrice,
  currency = "ETB",
  onContinue,
  loading,
  disabled,
}: Props) {
  const reduce = useReducedMotion();
  const unit = Number(unitPrice);
  const total = Number.isFinite(unit) ? (unit * seatCount).toFixed(2) : "—";

  return (
    <motion.div
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={reduce ? false : { y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-4 shadow-lg backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {seatCount} seat{seatCount === 1 ? "" : "s"} selected
          </p>
          <p className="text-xl font-semibold">
            {total} {currency}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={onContinue}
          disabled={disabled || seatCount === 0}
        >
          {loading ? "Creating booking…" : "Continue to checkout"}
        </Button>
      </div>
    </motion.div>
  );
}
