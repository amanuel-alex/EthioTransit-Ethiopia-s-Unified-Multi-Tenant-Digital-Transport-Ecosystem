"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bus, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function passengerInitials(phone: string | undefined): string {
  if (!phone?.trim()) return "?";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 2) return digits.slice(-2);
  return phone.slice(0, 2).toUpperCase();
}

function SeatNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      className={cn(
        "relative shrink-0 px-3 py-3 text-sm font-medium transition-colors sm:px-5",
        active
          ? "text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[hsl(152,65%,48%)] sm:after:left-5 sm:after:right-5"
          : "text-zinc-500 hover:text-zinc-200",
      )}
    >
      {children}
    </Link>
  );
}

function GearThemeButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        disabled
        aria-label="Theme"
      >
        <Settings className="h-5 w-5" />
      </Button>
    );
  }
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
}

export function PassengerSeatHeader() {
  const { user, logout } = useAuth();
  const initials = passengerInitials(user?.phone);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <Link
          href="/home"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(152,65%,48%)] text-zinc-950 sm:hidden">
            <Bus className="h-4 w-4" aria-hidden />
          </span>
          <span className="bg-gradient-to-r from-[hsl(152,65%,52%)] to-[hsl(152,65%,42%)] bg-clip-text text-lg font-bold tracking-tight text-transparent">
            EthioTransit
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          <SeatNavLink href="/bookings">Bookings</SeatNavLink>
          <SeatNavLink href="/home">Home</SeatNavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            asChild
          >
            <Link href="/bookings" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <GearThemeButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(152,65%,48%)] text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(152,65%,48%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                aria-label="Account menu"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/10 bg-zinc-900 text-zinc-100"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.phone}</p>
                  <p className="text-xs text-zinc-500">Passenger</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="focus:bg-white/10">
                <Link href="/auth">Switch account</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="focus:bg-white/10"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
