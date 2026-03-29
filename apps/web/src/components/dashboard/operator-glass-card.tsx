import { cn } from "@/lib/utils";

export function OperatorGlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
