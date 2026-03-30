import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/operator-applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/revenue", label: "Revenue", icon: Wallet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
