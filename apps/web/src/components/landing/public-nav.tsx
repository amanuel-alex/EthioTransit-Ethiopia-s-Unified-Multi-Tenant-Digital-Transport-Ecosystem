"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/auth?next=/bookings", label: "Bookings" },
  { href: "#features", label: "Features" },
  { href: "#footer", label: "Contact us" },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-[hsl(152,65%,48%)]"
        >
          EthioTransit
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {nav.map(({ href, label }) => {
            const isHome = href === "/";
            const active = isHome && pathname === "/";
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-[hsl(152,65%,48%)]"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {label}
                {active ? (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[hsl(152,65%,48%)]"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/auth?next=/search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[hsl(152,65%,48%)] transition-colors hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link
            href="/auth"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(152,65%,48%)]/40 text-[hsl(152,65%,48%)] transition-colors hover:bg-[hsl(152,65%,48%)]/10"
            aria-label="Sign in"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <nav className="flex justify-center gap-1 border-t border-white/5 px-2 py-2 md:hidden">
        {nav.map(({ href, label }) => {
          const active = href === "/" && pathname === "/";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                active
                  ? "bg-[hsl(152,65%,48%)]/15 text-[hsl(152,65%,48%)]"
                  : "text-zinc-500",
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
