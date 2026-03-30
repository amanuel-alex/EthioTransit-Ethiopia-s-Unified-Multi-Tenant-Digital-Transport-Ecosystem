"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bus, LogOut, Menu, Search, Shield, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PassengerSeatHeader } from "@/components/app/passenger-seat-header";
import { ADMIN_NAV } from "@/components/dashboard/admin-nav";
import { OPERATOR_NAV } from "@/components/dashboard/operator-nav";
import { OperatorSidebar } from "@/components/dashboard/operator-sidebar";
import { PlatformAdminSidebar } from "@/components/dashboard/platform-admin-sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
  variant = "light",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "light" | "dark";
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
        variant === "dark"
          ? active
            ? "bg-[hsl(152,65%,48%)]/18 text-[hsl(152,65%,54%)]"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          : active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminSidebarRoute =
    role === "ADMIN" && pathname.startsWith("/admin");
  const isOperatorShell = role === "COMPANY";
  /** Passengers: dark shell + seat-style header only after search (seat → checkout → ticket). Hub stays light. */
  const passengerBookingChrome =
    role === "PASSENGER" &&
    (pathname.startsWith("/seat") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/ticket"));
  const useDarkConsoleShell = isOperatorShell || isAdminSidebarRoute;
  const useDarkRoot = useDarkConsoleShell || passengerBookingChrome;

  const homeHref =
    role === "PASSENGER"
      ? "/home"
      : role === "COMPANY"
        ? "/dashboard"
        : role === "ADMIN"
          ? "/admin"
          : "/home";

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        useDarkRoot && "dark bg-[#050505] text-zinc-100",
      )}
    >
      {isOperatorShell ? <OperatorSidebar className="hidden md:flex" /> : null}
      {isAdminSidebarRoute ? (
        <PlatformAdminSidebar className="hidden md:flex" />
      ) : null}

      <div
        className={cn(
          "flex min-h-screen flex-col",
          (isOperatorShell || isAdminSidebarRoute) && "md:pl-[260px]",
        )}
      >
        {useDarkConsoleShell ? (
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-white/10 bg-[#0a0a0a]/85 px-4 backdrop-blur-md sm:px-6">
            {isOperatorShell ? (
              <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mr-auto md:hidden rounded-full border-white/15 bg-white/5 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    <Menu className="mr-2 h-4 w-4" strokeWidth={2} />
                    Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#0a0a0a] text-zinc-100 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Operator</DialogTitle>
                  </DialogHeader>
                  <nav className="flex flex-col gap-1 py-2">
                    {OPERATOR_NAV.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                          pathname === href || pathname.startsWith(`${href}/`)
                            ? "bg-[hsl(152,65%,48%)]/15 text-[hsl(152,65%,48%)]"
                            : "text-zinc-400 hover:bg-white/5",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                        {label}
                      </Link>
                    ))}
                    <Link
                      href="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-2 rounded-xl bg-[hsl(152,65%,44%)] px-3 py-3 text-center text-sm font-semibold text-zinc-950"
                    >
                      New dispatch
                    </Link>
                  </nav>
                </DialogContent>
              </Dialog>
            ) : null}
            {role === "ADMIN" && isAdminSidebarRoute ? (
              <>
                <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mr-auto md:hidden rounded-full border-white/15 bg-white/5 text-xs text-zinc-200 hover:bg-white/10"
                    >
                      <Menu className="mr-2 h-4 w-4" strokeWidth={2} />
                      Menu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#0a0a0a] text-zinc-100 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Admin</DialogTitle>
                    </DialogHeader>
                    <nav className="flex flex-col gap-1 py-2">
                      {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                            pathname === href || pathname.startsWith(`${href}/`)
                              ? "bg-[hsl(152,65%,48%)]/15 text-[hsl(152,65%,48%)]"
                              : "text-zinc-400 hover:bg-white/5",
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                          {label}
                        </Link>
                      ))}
                    </nav>
                  </DialogContent>
                </Dialog>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mr-auto hidden md:inline-flex rounded-full border-white/15 bg-white/5 text-xs text-zinc-200 hover:bg-white/10"
                >
                  <Link href="/auth">Operator console</Link>
                </Button>
              </>
            ) : null}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="max-w-[10rem] truncate border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                >
                  {user?.phone ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.phone}</p>
                    <p className="text-xs text-muted-foreground">
                      {role === "COMPANY"
                        ? "Transport operator"
                        : role === "ADMIN"
                          ? "Platform owner"
                          : "Passenger"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/auth">Switch account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
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
          </header>
        ) : passengerBookingChrome ? (
          <PassengerSeatHeader />
        ) : (
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link
                href={homeHref}
                className="flex items-center gap-2 font-semibold tracking-tight"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bus className="h-4 w-4" aria-hidden />
                </span>
                <span className="hidden sm:inline">EthioTransit</span>
              </Link>

              <nav className="flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-1 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
                {role === "PASSENGER" ? (
                  <>
                    <NavLink href="/home">Home</NavLink>
                    <NavLink href="/search">
                      <span className="inline-flex items-center gap-1">
                        <Search className="h-3.5 w-3.5" aria-hidden />
                        Search
                      </span>
                    </NavLink>
                    <NavLink href="/bookings">
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5" aria-hidden />
                        Bookings
                      </span>
                    </NavLink>
                  </>
                ) : null}
                {role === "ADMIN" ? (
                  <NavLink href="/admin">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" aria-hidden />
                      System analytics
                    </span>
                  </NavLink>
                ) : null}
              </nav>

              <div className="flex items-center gap-1">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="max-w-[10rem] truncate"
                    >
                      {user?.phone ?? "Account"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/auth">Switch account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
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
        )}

        <main
          className={cn(
            "mx-auto w-full flex-1",
            useDarkConsoleShell
              ? "max-w-[1600px] px-4 py-8 sm:px-6"
              : "max-w-7xl px-4 py-8 sm:px-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
