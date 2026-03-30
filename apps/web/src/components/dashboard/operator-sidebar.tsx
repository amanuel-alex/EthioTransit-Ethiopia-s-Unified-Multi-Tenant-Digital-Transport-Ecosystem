"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPERATOR_NAV } from "@/components/dashboard/operator-nav";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export function OperatorSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/10 bg-[#0a0a0a] text-zinc-100",
        className,
      )}
    >
      <div className="border-b border-white/10 px-5 py-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-[hsl(152,65%,48%)]"
        >
          EthioTransit
        </Link>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(152,65%,48%)]/20 text-xs font-bold text-[hsl(152,65%,48%)]">
            OP
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              Operator Console
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Fleet & revenue
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {OPERATOR_NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(152,65%,48%)]/15 text-[hsl(152,65%,48%)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button
          asChild
          className="mb-4 h-11 w-full rounded-xl bg-[hsl(152,65%,44%)] font-semibold text-zinc-950 shadow-[0_0_24px_-8px_hsl(152,65%,45%)] hover:bg-[hsl(152,65%,50%)]"
        >
          <Link href="/search">New dispatch</Link>
        </Button>
        <a
          href="mailto:support@ethiotransit.et"
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <CircleHelp className="h-4 w-4" />
          Help Center
        </a>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
        <p className="mt-2 truncate px-3 text-[10px] text-zinc-600">{user?.phone}</p>
      </div>
    </aside>
  );
}
