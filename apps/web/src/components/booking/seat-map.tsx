"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Bus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  capacity: number;
  available: Set<number>;
  occupied: Set<number>;
  selected: number[];
  onToggle: (seatNo: number) => void;
  /** 2+1 coach layout (aisle); fallback grid if capacity is tiny */
  layout?: "coach" | "grid";
};

function buildCoachRows(capacity: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let s = 1;
  while (s <= capacity) {
    const a = s++;
    const b = s <= capacity ? s++ : null;
    const c = s <= capacity ? s++ : null;
    rows.push([a, b, c]);
  }
  return rows;
}

function SeatCell({
  seatNo,
  available,
  occupied,
  selected,
  onToggle,
  reduce,
}: {
  seatNo: number;
  available: Set<number>;
  occupied: Set<number>;
  selected: number[];
  onToggle: (n: number) => void;
  reduce: boolean | null;
}) {
  const isSel = selected.includes(seatNo);
  const isAvail = available.has(seatNo);
  const isOcc = occupied.has(seatNo) || !isAvail;
  const disabled = isOcc && !isSel;
  const label = seatNo.toString().padStart(2, "0");

  return (
    <motion.button
      type="button"
      data-seat={seatNo}
      disabled={disabled}
      onClick={() => !disabled && onToggle(seatNo)}
      variants={{
        hidden: { opacity: 0, scale: 0.85 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { type: "spring", stiffness: 420, damping: 26 },
        },
      }}
      whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
      className={cn(
        "scroll-my-8 scroll-mt-4 scroll-mb-32 flex aspect-square min-h-[44px] max-h-[52px] w-full items-center justify-center rounded-xl border-2 text-xs font-semibold tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(152,65%,48%)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
        isSel &&
          "border-[hsl(152,65%,48%)] bg-[hsl(152,65%,48%)] text-zinc-950 shadow-[0_0_24px_hsla(152,65%,48%,0.45)]",
        !isSel &&
          isAvail &&
          "border-[hsl(152,65%,42%)]/80 bg-zinc-800/40 text-zinc-100 hover:border-[hsl(152,65%,48%)] hover:bg-zinc-800",
        disabled &&
          "cursor-not-allowed border-zinc-700/60 bg-zinc-800/30 text-zinc-600 line-through opacity-70",
      )}
      aria-pressed={isSel}
      aria-label={
        disabled
          ? `Seat ${label} unavailable`
          : `Seat ${label}${isSel ? ", selected" : ", available"}`
      }
    >
      {label}
    </motion.button>
  );
}

export function SeatMap({
  capacity,
  available,
  occupied,
  selected,
  onToggle,
  layout = "grid",
}: Props) {
  const reduce = useReducedMotion();
  const stagger = reduce ? 0 : 0.02;
  const mapRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selected.length === 0) return;
    const targetSeat = Math.max(...selected);
    const root = mapRootRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-seat="${targetSeat}"]`);
    if (!(el instanceof HTMLElement)) return;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    requestAnimationFrame(() => {
      el.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior,
      });
    });
  }, [selected, reduce]);

  if (layout === "coach") {
    const rows = buildCoachRows(capacity);
    return (
      <motion.div
        ref={mapRootRef}
        data-ethio-seat-map
        className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 p-4 shadow-2xl sm:p-6 md:p-8"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: stagger, delayChildren: reduce ? 0 : 0.05 },
          },
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Bus className="h-5 w-5 text-[hsl(152,65%,48%)]" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider">Front</span>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-800/80"
            aria-hidden
          >
            <span className="text-lg text-zinc-400">◎</span>
          </div>
        </div>

        <div className="mx-auto flex max-w-md flex-col gap-3">
          {rows.map((triple, rowIdx) => (
            <motion.div
              key={rowIdx}
              variants={{
                hidden: { opacity: 0, x: -6 },
                show: { opacity: 1, x: 0 },
              }}
              className="flex items-stretch gap-2 sm:gap-3"
            >
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
                {triple[0] != null ? (
                  <SeatCell
                    seatNo={triple[0]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <span className="min-h-[44px]" />
                )}
                {triple[1] != null ? (
                  <SeatCell
                    seatNo={triple[1]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <span className="min-h-[44px]" />
                )}
              </div>
              <div
                className="w-2 shrink-0 self-stretch rounded-full bg-zinc-700/80"
                aria-hidden
              />
              <div className="flex w-[52px] shrink-0 justify-center sm:w-[56px]">
                {triple[2] != null ? (
                  <div className="w-full">
                    <SeatCell
                      seatNo={triple[2]}
                      available={available}
                      occupied={occupied}
                      selected={selected}
                      onToggle={onToggle}
                      reduce={reduce}
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  const cols = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(capacity))));

  return (
    <motion.div
      ref={mapRootRef}
      data-ethio-seat-map
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
      {Array.from({ length: capacity }, (_, i) => i + 1).map((seatNo) => (
        <SeatCell
          key={seatNo}
          seatNo={seatNo}
          available={available}
          occupied={occupied}
          selected={selected}
          onToggle={onToggle}
          reduce={reduce}
        />
      ))}
    </motion.div>
  );
}
