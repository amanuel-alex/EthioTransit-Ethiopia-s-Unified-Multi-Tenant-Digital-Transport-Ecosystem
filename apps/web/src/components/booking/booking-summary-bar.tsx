"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  seatCount: number;
  unitPrice: string;
  currency?: string;
  selectedSeats?: number[];
  onCancelSelection?: () => void;
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function BookingSummaryBar({
  seatCount,
  unitPrice,
  currency = "ETB",
  selectedSeats = [],
  onCancelSelection,
  onContinue,
  loading,
  disabled,
}: Props) {
  const reduce = useReducedMotion();
  const unit = Number(unitPrice);
  const total = Number.isFinite(unit) ? (unit * seatCount).toFixed(0) : "—";

  const firstLabel =
    selectedSeats.length > 0 ? selectedSeats[0].toString().padStart(2, "0") : null;
  let secondLabel: string;
  let secondHighlight = false;
  if (selectedSeats.length === 0) {
    secondLabel = "None";
  } else if (selectedSeats.length === 1) {
    secondLabel = "None";
  } else if (selectedSeats.length === 2) {
    secondLabel = selectedSeats[1].toString().padStart(2, "0");
    secondHighlight = true;
  } else {
    secondLabel = `+${selectedSeats.length - 1} more`;
  }

  return (
    <motion.div
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={reduce ? false : { y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050505]/97 p-4 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Selected seats
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums",
                  firstLabel
                    ? "border border-[hsl(152,65%,48%)]/55 bg-[hsl(152,65%,48%)] text-zinc-950 shadow-[0_0_20px_hsla(152,65%,48%,0.35)]"
                    : "border border-zinc-700/80 bg-zinc-800/60 text-zinc-500",
                )}
              >
                {firstLabel ?? "—"}
              </span>
              <span
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-semibold tabular-nums",
                  secondHighlight
                    ? "border-[hsl(152,65%,48%)]/50 bg-[hsl(152,65%,48%)]/15 text-[hsl(152,65%,55%)]"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500",
                )}
              >
                {secondLabel}
              </span>
            </div>
          </div>
          <div className="hidden h-12 w-px bg-white/10 sm:block" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Total amount
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-white">
              {total}{" "}
              <span className="text-xl font-semibold text-zinc-200">{currency}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {onCancelSelection ? (
            <button
              type="button"
              className="text-sm font-medium capitalize text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline disabled:opacity-40"
              onClick={onCancelSelection}
              disabled={seatCount === 0}
            >
              Cancel selection
            </button>
          ) : null}
          <Button
            size="lg"
            className="h-12 gap-2 rounded-xl bg-[hsl(152,65%,48%)] px-8 text-base font-semibold text-zinc-950 shadow-[0_0_28px_hsla(152,65%,48%,0.45)] hover:bg-[hsl(152,65%,42%)]"
            onClick={onContinue}
            disabled={disabled || seatCount === 0}
          >
            {loading ? "Creating booking…" : "Proceed to Payment"}
            {!loading ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
