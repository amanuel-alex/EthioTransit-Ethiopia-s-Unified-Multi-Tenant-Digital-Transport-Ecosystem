"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import type { BookingRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

export default function OperatorBookingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const params: {
        from?: string;
        to?: string;
        status?: string;
      } = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      if (status !== "all") params.status = status;
      const b = await api.listCompanyBookings(params);
      setRows(b.data);
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
  }, [api, user?.role, from, to, status, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Bookings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Filter by date and payment status.
      </p>

      <OperatorGlassCard className="mt-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-zinc-400">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-white/10 bg-zinc-900/80 text-white w-[11rem]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-white/10 bg-zinc-900/80 text-white w-[11rem]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[10rem] border-white/10 bg-zinc-900/80 text-white">
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
            variant="outline"
            className="border-white/15 bg-white/5 text-zinc-200"
            onClick={() => void load()}
          >
            Apply
          </Button>
        </div>
      </OperatorGlassCard>

      <OperatorGlassCard className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-64 w-full bg-white/10" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Passenger</TableHead>
                <TableHead className="text-zinc-400">Route</TableHead>
                <TableHead className="text-zinc-400">Seats</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="text-zinc-200">
                    {row.user?.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-white">
                    {row.schedule.route.origin} →{" "}
                    {row.schedule.route.destination}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {row.seats.map((s) => s.seatNo).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        row.status === "PAID"
                          ? "border-0 bg-emerald-500/20 text-emerald-300"
                          : row.status === "PENDING"
                            ? "border-0 bg-amber-500/20 text-amber-200"
                            : "border-0 bg-zinc-500/20 text-zinc-300"
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
        )}
      </OperatorGlassCard>
    </div>
  );
}
