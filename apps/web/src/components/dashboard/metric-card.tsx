import { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
};

export function MetricCard({ label, value, icon: Icon, hint, className }: Props) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="rounded-lg bg-primary/15 p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </GlassCard>
  );
}
