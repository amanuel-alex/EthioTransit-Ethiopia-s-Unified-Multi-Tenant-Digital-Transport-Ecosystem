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

  const chips =
    selectedSeats.length > 0
      ? selectedSeats.slice(0, 6).map((n) => n.toString().padStart(2, "0"))
      : [];

  return (
    <motion.div
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={reduce ? false : { y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/95 p-4 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Selected seats
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.length ? (
                chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-lg border border-[hsl(152,65%,48%)]/50 bg-[hsl(152,65%,48%)]/15 px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(152,65%,55%)]"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm text-zinc-500">
                  None
                </span>
              )}
              {selectedSeats.length > 6 ? (
                <span className="self-center text-xs text-zinc-500">
                  +{selectedSeats.length - 6} more
                </span>
              ) : null}
            </div>
          </div>
          <div className="h-px w-full bg-white/10 sm:h-12 sm:w-px" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">
              {total}{" "}
              <span className="text-lg font-semibold text-amber-400">{currency}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {onCancelSelection ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline"
              onClick={onCancelSelection}
              disabled={seatCount === 0}
            >
              Cancel selection
            </button>
          ) : null}
          <Button
            size="lg"
            className="h-12 gap-2 rounded-xl bg-[hsl(152,65%,48%)] px-8 text-base font-semibold text-zinc-950 shadow-lg shadow-[hsl(152,65%,48%)]/25 hover:bg-[hsl(152,65%,42%)]"
            onClick={onContinue}
            disabled={disabled || seatCount === 0}
          >
            {loading ? "Creating booking…" : "Proceed to payment"}
            {!loading ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
