"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  capacity: number;
  available: Set<number>;
  occupied: Set<number>;
  selected: number[];
  onToggle: (seatNo: number) => void;
  /** 2+2 coach (aisle); grid fallback if layout is grid */
  layout?: "coach" | "grid";
};

/** 2+2 intercity layout: left pair | aisle | right pair */
function buildCoachRows22(capacity: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let s = 1;
  while (s <= capacity) {
    const c1 = s++;
    const c2 = s <= capacity ? s++ : null;
    const c3 = s <= capacity ? s++ : null;
    const c4 = s <= capacity ? s++ : null;
    rows.push([c1, c2, c3, c4]);
  }
  return rows;
}

function SteeringFrontMark({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Front of coach"
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-800/90 shadow-inner",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-zinc-400"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.25" fill="currentColor" />
        <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" strokeLinecap="round" />
      </svg>
    </div>
  );
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
        "scroll-my-8 scroll-mt-4 scroll-mb-32 flex aspect-square min-h-[44px] max-h-[52px] w-full items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(152,65%,48%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121214]",
        isSel &&
          "border-[hsl(152,65%,48%)] bg-[hsl(152,65%,48%)] text-zinc-950 shadow-[0_0_24px_hsla(152,65%,48%,0.52)]",
        !isSel &&
          isAvail &&
          "border-[hsl(152,65%,52%)]/95 bg-zinc-950/85 text-zinc-100 shadow-none hover:border-[hsl(152,65%,54%)] hover:bg-zinc-900/90",
        disabled &&
          "cursor-not-allowed border-zinc-800 bg-zinc-900/55 text-zinc-600 opacity-45 line-through",
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

function EmptySeatSlot() {
  return <span className="min-h-[44px] min-w-0 flex-1" aria-hidden />;
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
    const rows = buildCoachRows22(capacity);
    return (
      <motion.div
        ref={mapRootRef}
        data-ethio-seat-map
        className="rounded-[1.35rem] border border-white/[0.08] bg-[#121214]/95 p-5 shadow-[0_32px_90px_rgba(0,0,0,0.72)] ring-1 ring-white/[0.04] sm:p-7 md:p-8"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: stagger,
              delayChildren: reduce ? 0 : 0.05,
            },
          },
        }}
      >
        <div className="mb-6 flex items-center justify-end border-b border-white/10 pb-5">
          <SteeringFrontMark />
        </div>

        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:gap-3.5">
          {rows.map((quads, rowIdx) => (
            <motion.div
              key={rowIdx}
              variants={{
                hidden: { opacity: 0, x: -6 },
                show: { opacity: 1, x: 0 },
              }}
              className="flex items-stretch gap-2 sm:gap-3"
            >
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
                {quads[0] != null ? (
                  <SeatCell
                    seatNo={quads[0]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <EmptySeatSlot />
                )}
                {quads[1] != null ? (
                  <SeatCell
                    seatNo={quads[1]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <EmptySeatSlot />
                )}
              </div>
              <div
                className="w-2 shrink-0 self-stretch rounded-full bg-zinc-700/75"
                aria-hidden
              />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
                {quads[2] != null ? (
                  <SeatCell
                    seatNo={quads[2]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <EmptySeatSlot />
                )}
                {quads[3] != null ? (
                  <SeatCell
                    seatNo={quads[3]}
                    available={available}
                    occupied={occupied}
                    selected={selected}
                    onToggle={onToggle}
                    reduce={reduce}
                  />
                ) : (
                  <EmptySeatSlot />
                )}
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
          transition: {
            staggerChildren: stagger,
            delayChildren: reduce ? 0 : 0.04,
          },
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
