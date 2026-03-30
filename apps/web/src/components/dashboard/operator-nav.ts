import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bus,
  CalendarRange,
  CircleDollarSign,
  LayoutDashboard,
  Route,
  Ticket,
  Users,
} from "lucide-react";

export type OperatorNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const OPERATOR_NAV: OperatorNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/fleet", label: "Fleet", icon: Bus },
  { href: "/dashboard/routes", label: "Routes", icon: Route },
  { href: "/dashboard/schedules", label: "Schedules", icon: CalendarRange },
  { href: "/dashboard/bookings", label: "Bookings", icon: Ticket },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/finance", label: "Finance", icon: CircleDollarSign },
];
