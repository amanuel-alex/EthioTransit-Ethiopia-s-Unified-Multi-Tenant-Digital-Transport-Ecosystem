"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, LogOut, Shield } from "lucide-react";
import { ADMIN_NAV } from "@/components/dashboard/admin-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export function PlatformAdminSidebar({ className }: { className?: string }) {
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
          href="/admin"
          className="text-lg font-bold tracking-tight text-[hsl(152,65%,48%)]"
        >
          EthioTransit
        </Link>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
            AD
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              Platform owner
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Global administration
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
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
          variant="outline"
          className="mb-4 h-10 w-full rounded-xl border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
        >
          <Link href="/auth">Operator sign-in</Link>
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
        <p className="mt-2 flex items-center gap-1.5 px-3 text-[10px] text-zinc-600">
          <Shield className="h-3 w-3" />
          {user?.phone}
        </p>
      </div>
    </aside>
  );
}
