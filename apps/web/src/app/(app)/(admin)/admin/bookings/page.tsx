"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

type BookingAdminRow = {
  id: string;
  status: string;
  totalAmount: unknown;
  currency: string;
  createdAt: string;
  user?: { phone: string };
  company?: { name: string };
  schedule: {
    route: { origin: string; destination: string };
    bus: { plateNumber: string };
  };
  seats: { seatNo: number }[];
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<BookingAdminRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const r = await api.adminBookings({
        page,
        limit: 25,
        status: status === "all" ? undefined : status,
        companyId: companyId.trim() || undefined,
      });
      setRows(r.data as BookingAdminRow[]);
      setTotalPages(Math.max(1, r.totalPages));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, page, status, companyId, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Platform-wide reservations and payment states.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 bg-white/5">
          <Link href="/admin">Overview</Link>
        </Button>
      </div>

      <OperatorGlassCard className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-zinc-400">Company ID</Label>
            <Input
              placeholder="cuid…"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-56 border-white/10 bg-white/5 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 border-white/10 bg-white/5 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="bg-white/10 text-white"
            onClick={() => void load()}
          >
            Refresh
          </Button>
        </div>
      </OperatorGlassCard>

      <OperatorGlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full bg-white/10" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Operator</TableHead>
                  <TableHead className="text-zinc-400">Passenger</TableHead>
                  <TableHead className="text-zinc-400">Route</TableHead>
                  <TableHead className="text-zinc-400">Seats</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-white/5">
                    <TableCell className="text-zinc-300">
                      {row.company?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-zinc-200">
                      {row.user?.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-white text-sm">
                      {row.schedule.route.origin} →{" "}
                      {row.schedule.route.destination}
                      <span className="block text-xs text-zinc-500">
                        {row.schedule.bus.plateNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {row.seats.map((s) => s.seatNo).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-zinc-500/20 text-zinc-300"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-zinc-300">
                      {String(row.totalAmount)} {row.currency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <span className="text-xs text-zinc-500">Page {page}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </OperatorGlassCard>
    </div>
  );
}
