"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Decorative network graphic for the app-download section (reference design). */
export function PlexusGraphic() {
  const reduce = useReducedMotion();
  const nodes = [
    { cx: 20, cy: 30 },
    { cx: 55, cy: 18 },
    { cx: 88, cy: 35 },
    { cx: 42, cy: 55 },
    { cx: 72, cy: 62 },
    { cx: 30, cy: 78 },
    { cx: 65, cy: 85 },
  ];
  const lines = [
    [0, 1],
    [1, 2],
    [0, 3],
    [1, 3],
    [1, 4],
    [2, 4],
    [3, 5],
    [4, 5],
    [4, 6],
    [5, 6],
  ];

  return (
    <motion.div
      className="relative h-64 w-full overflow-hidden rounded-3xl md:h-full md:min-h-[280px]"
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? false : { opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 70% 40%, hsl(152 65% 38% / 0.4), transparent 65%)",
        }}
      />
      <svg
        className="relative h-full w-full text-[hsl(152,65%,48%)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {lines.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a]!.cx}
            y1={nodes[a]!.cy}
            x2={nodes[b]!.cx}
            y2={nodes[b]!.cy}
            stroke="currentColor"
            strokeWidth={0.35}
            strokeOpacity={0.45}
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.cx} cy={n.cy} r={1.4} fill="currentColor" />
        ))}
      </svg>
    </motion.div>
  );
}
