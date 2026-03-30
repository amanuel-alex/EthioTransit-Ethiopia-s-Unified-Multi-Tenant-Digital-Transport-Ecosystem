"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/lib/api/hooks";
import type { BookingRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { saveCheckoutDraft } from "@/lib/booking/checkout-storage";

function fmtMoney(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null && "toString" in v) {
    return String((v as { toString: () => string }).toString());
  }
  return String(v);
}

export default function BookingsPage() {
  const router = useRouter();
  const api = useApi();
  const { user, logout } = useAuth();
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } =
        user?.role === "COMPANY"
          ? await api.listCompanyBookings()
          : await api.listUserBookings();
      setRows(data);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load bookings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const list = rows ?? [];
    const now = Date.now();
    return {
      upcoming: list.filter((b) => {
        if (b.status === "CANCELLED") return false;
        if (b.status === "PENDING") return true;
        return new Date(b.schedule.departsAt).getTime() >= now;
      }),
      completed: list.filter(
        (b) =>
          b.status === "PAID" &&
          new Date(b.schedule.departsAt).getTime() < now,
      ),
      cancelled: list.filter((b) => b.status === "CANCELLED"),
    };
  }, [rows]);

  const confirmCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await api.cancelBooking(cancelId);
      toast.success("Booking cancelled");
      setCancelId(null);
      await load();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  function BookingList({ list }: { list: BookingRow[] }) {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    if (!list.length) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      );
    }
    return (
      <ul className="space-y-4">
        {list.map((b) => (
          <li key={b.id}>
            <GlassCard className="p-5 text-left">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {b.schedule.route.origin} →{" "}
                    {b.schedule.route.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en-ET", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(b.schedule.departsAt))}{" "}
                    · {b.schedule.bus.plateNumber}
                  </p>
                  <p className="mt-1 text-sm">
                    Seats: {b.seats.map((s) => s.seatNo).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      b.status === "PAID"
                        ? "default"
                        : b.status === "PENDING"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {b.status}
                  </Badge>
                  <p className="mt-2 text-sm font-medium">
                    {fmtMoney(b.totalAmount)} {b.currency}
                  </p>
                  {b.status === "PENDING" && user?.role === "PASSENGER" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          saveCheckoutDraft({
                            bookingId: b.id,
                            totalAmount: fmtMoney(b.totalAmount),
                            currency: b.currency,
                            scheduleId: b.schedule.id,
                            seatNumbers: b.seats.map((s) => s.seatNo),
                            routeLabel: `${b.schedule.route.origin} → ${b.schedule.route.destination}`,
                            departsAt: b.schedule.departsAt,
                          });
                          router.push("/checkout");
                        }}
                      >
                        Pay
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelId(b.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description={
          user?.role === "COMPANY"
            ? "Bookings for your company."
            : "Your trips and tickets."
        }
      />
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          <BookingList list={grouped.upcoming} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <BookingList list={grouped.completed} />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <BookingList list={grouped.cancelled} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
            <DialogDescription>
              Pending bookings only. Seat locks will be released.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => void confirmCancel()}
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
