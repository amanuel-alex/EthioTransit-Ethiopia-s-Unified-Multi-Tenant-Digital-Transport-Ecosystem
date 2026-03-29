"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const nav = [
  { href: "/", label: "Home" },
  { href: "/bookings", label: "Bookings" },
  { href: "/#features", label: "Features" },
  { href: "/#contact", label: "Contact us" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-emerald-500 transition hover:text-emerald-400"
        >
          EthioTransit
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {nav.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href.startsWith("/#")
                  ? false
                  : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-emerald-500"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {label}
                {active ? (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/#search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-500 transition hover:bg-zinc-800/80 hover:text-emerald-400"
            aria-label="Search routes"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/auth"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-emerald-500 transition hover:border-emerald-500/50 hover:bg-zinc-800/50"
            aria-label="Sign in"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/"
            className="ml-1 hidden sm:flex"
            aria-label="EthioTransit home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-emerald-500">
              <Bus className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
