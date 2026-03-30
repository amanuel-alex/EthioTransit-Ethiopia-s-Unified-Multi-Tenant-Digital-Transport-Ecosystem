"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  capacity: number;
  available: Set<number>;
  occupied: Set<number>;
  selected: number[];
  onToggle: (seatNo: number) => void;
};

export function SeatMap({
  capacity,
  available,
  occupied,
  selected,
  onToggle,
}: Props) {
  const reduce = useReducedMotion();
  const cols = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(capacity))));

  const stagger = reduce ? 0 : 0.022;

  return (
    <motion.div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: reduce ? 0 : 0.04 },
        },
      }}
    >
      {Array.from({ length: capacity }, (_, i) => i + 1).map((seatNo) => {
        const isSel = selected.includes(seatNo);
        const isAvail = available.has(seatNo);
        const isOcc = occupied.has(seatNo) || !isAvail;
        const disabled = isOcc && !isSel;

        return (
          <motion.button
            key={seatNo}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggle(seatNo)}
            variants={{
              hidden: { opacity: 0, scale: 0.85 },
              show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 420, damping: 26 } },
            }}
            whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSel &&
                "border-primary bg-primary text-primary-foreground shadow-md",
              !isSel &&
                isAvail &&
                "border-border bg-secondary/60 hover:bg-secondary",
              disabled && "cursor-not-allowed border-muted bg-muted/40 text-muted-foreground line-through",
            )}
            aria-pressed={isSel}
            aria-label={
              disabled
                ? `Seat ${seatNo} unavailable`
                : `Seat ${seatNo}${isSel ? ", selected" : ", available"}`
            }
          >
            {seatNo}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
