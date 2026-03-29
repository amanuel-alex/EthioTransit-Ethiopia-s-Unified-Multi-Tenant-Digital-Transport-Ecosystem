"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";

type Row = { hour: string; bookings: number };

export function PeakHoursChart({ data }: { data: Row[] }) {
  if (!data.length) {
    return (
      <GlassCard className="p-6 text-sm text-muted-foreground">
        No peak-hour data yet.
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <p className="mb-4 text-sm font-medium">Bookings by hour (platform)</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
