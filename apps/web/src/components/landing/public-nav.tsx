"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/partners/apply", label: "Partner" },
  { href: "/auth?next=/bookings", label: "Bookings" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact us" },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-[hsl(152,72%,48%)] sm:text-[1.35rem]"
        >
          EthioTransit
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0 md:flex">
          {nav.map(({ href, label }) => {
            const isHome = href === "/";
            const isPartner = href === "/partners/apply";
            const active =
              (isHome && pathname === "/") ||
              (isPartner && pathname === "/partners/apply");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-5 py-2.5 text-sm font-medium tracking-wide transition-colors",
                  active
                    ? "text-[hsl(152,70%,52%)]"
                    : "text-zinc-200/90 hover:text-white",
                )}
              >
                {label}
                {active ? (
                  <span
                    className="absolute bottom-1 left-5 right-5 h-[3px] rounded-full bg-[hsl(152,72%,48%)]"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/auth?next=/search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Search routes"
          >
            <Search className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.85} />
          </Link>
          <Link
            href="/auth"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/[0.04] text-zinc-100 transition-colors hover:border-[hsl(152,65%,48%)]/50 hover:bg-[hsl(152,65%,48%)]/10 hover:text-[hsl(152,70%,55%)]"
            aria-label="Account"
          >
            <UserRound className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <nav className="flex justify-center gap-1 border-t border-white/[0.06] px-2 py-2 md:hidden">
        {nav.map(({ href, label }) => {
          const active =
            (href === "/" && pathname === "/") ||
            (href === "/partners/apply" && pathname === "/partners/apply");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                active
                  ? "bg-[hsl(152,65%,48%)]/15 text-[hsl(152,70%,52%)]"
                  : "text-zinc-400",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
