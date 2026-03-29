"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, LogOut, Search, Shield, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperatorSidebar } from "@/components/dashboard/operator-sidebar";
import { PlatformAdminSidebar } from "@/components/dashboard/platform-admin-sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
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

  const isAdminSidebarRoute =
    role === "ADMIN" && pathname.startsWith("/admin");
  const isOperatorShell = role === "COMPANY";
  const useDarkConsoleShell = isOperatorShell || isAdminSidebarRoute;

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
        useDarkConsoleShell && "dark bg-[#050505] text-zinc-100",
      )}
    >
      {isOperatorShell ? <OperatorSidebar /> : null}
      {isAdminSidebarRoute ? <PlatformAdminSidebar /> : null}

      <div
        className={cn(
          "flex min-h-screen flex-col",
          (isOperatorShell || isAdminSidebarRoute) && "pl-[260px]",
        )}
      >
        {useDarkConsoleShell ? (
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-white/10 bg-[#0a0a0a]/85 px-4 backdrop-blur-md sm:px-6">
            {role === "ADMIN" && isAdminSidebarRoute ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mr-auto rounded-full border-white/15 bg-white/5 text-xs text-zinc-200 hover:bg-white/10"
              >
                <Link href="/auth">Operator console</Link>
              </Button>
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

              <nav className="flex flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2">
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
