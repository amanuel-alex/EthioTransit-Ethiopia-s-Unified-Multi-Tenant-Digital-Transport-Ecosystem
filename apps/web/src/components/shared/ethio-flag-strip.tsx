import { cn } from "@/lib/utils";

export function EthioFlagStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn("ethio-flag-strip h-1 w-full rounded-full opacity-90", className)}
      aria-hidden
    />
  );
}
