"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";

type Row = { name: string; profit: number };

export function RevenueChart({ data }: { data: Row[] }) {
  if (!data.length) {
    return (
      <GlassCard className="p-6 text-sm text-muted-foreground">
        No route profitability data yet.
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <p className="mb-4 text-sm font-medium">Profit by route</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-28}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
            <Bar
              dataKey="profit"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Profit (ETB)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
