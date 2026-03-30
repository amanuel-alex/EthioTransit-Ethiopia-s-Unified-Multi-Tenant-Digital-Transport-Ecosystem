import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/** Simplified play mark for dark “Google Play” pill (readable at small sizes). */
function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 3.2c0-.4.42-.65.76-.45l12.8 7.35c.34.2.34.7 0 .9L5.26 18.25c-.34.2-.76-.05-.76-.45V3.2Z"
        fill="currentColor"
      />
      <path
        d="m17.06 12-2.8 1.6v-3.2l2.8 1.6Z"
        fill="currentColor"
        fillOpacity={0.85}
      />
      <path
        d="M14.26 7.4 5.26 2.75c-.34-.2-.76.05-.76.45v2.1l9.76 5.6v-3.5Z"
        fill="currentColor"
        fillOpacity={0.75}
      />
      <path
        d="M4.5 18.8c0 .4.42.65.76.45l9-5.15-2.8-1.6-6.96 4Z"
        fill="currentColor"
        fillOpacity={0.6}
      />
    </svg>
  );
}

type BadgeProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AppStoreBadgeButton({ className, ...props }: BadgeProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-5 text-[15px] font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100",
        className,
      )}
      {...props}
    >
      <AppleIcon className="h-6 w-6 shrink-0" />
      <span>App Store</span>
    </button>
  );
}

export function GooglePlayBadgeButton({ className, ...props }: BadgeProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-12 items-center gap-2.5 rounded-full border border-white/25 bg-zinc-800/90 px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:border-white/35 hover:bg-zinc-800",
        className,
      )}
      {...props}
    >
      <GooglePlayIcon className="h-6 w-6 shrink-0 text-white" />
      <span>Google Play</span>
    </button>
  );
}
