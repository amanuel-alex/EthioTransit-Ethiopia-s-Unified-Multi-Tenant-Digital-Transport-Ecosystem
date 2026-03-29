"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import type { BookingRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { clearCheckoutDraft } from "@/lib/booking/checkout-storage";

function TicketInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";
  const api = useApi();
  const { user, logout } = useAuth();
  const reduce = useReducedMotion();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !user) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const { data } =
          user.role === "COMPANY"
            ? await api.listCompanyBookings()
            : await api.listUserBookings();
        const b = data.find((x) => x.id === bookingId) ?? null;
        setBooking(b);
        clearCheckoutDraft();
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          logout();
          router.push("/auth");
          return;
        }
        toast.error(err.message ?? "Could not load ticket");
        setBooking(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [api, bookingId, logout, router, user]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "EthioTransit ticket", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      toast.error("Could not share");
    }
  };

  if (!bookingId) {
    return <p className="text-muted-foreground">Missing booking.</p>;
  }

  if (loading) {
    return <Skeleton className="h-96 w-full max-w-md" />;
  }

  if (!booking) {
    return (
      <p className="text-muted-foreground">
        Booking not found in your list yet.{" "}
        <Button variant="link" className="p-0" onClick={() => router.push("/bookings")}>
          View bookings
        </Button>
      </p>
    );
  }

  const qrPayload = `${booking.id}|ethiotransit`;

  return (
    <div className="mx-auto max-w-lg">
      <motion.div
        initial={reduce ? false : { scale: 0.92, opacity: 0 }}
        animate={reduce ? false : { scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="mb-8 flex justify-center"
      >
        <div className="rounded-full bg-primary/15 p-4 text-primary">
          <CheckCircle2 className="h-14 w-14" aria-hidden />
        </div>
      </motion.div>
      <GlassCard className="space-y-6 p-8 text-center">
        <div>
          <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>
            {booking.status}
          </Badge>
          <h1 className="mt-4 text-2xl font-semibold">You&apos;re set!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Show this QR at boarding. Booking #{booking.id.slice(0, 8)}…
          </p>
        </div>
        <div className="flex justify-center rounded-xl bg-white p-4 dark:bg-zinc-900">
          <QRCodeSVG value={qrPayload} size={180} level="M" />
        </div>
        <div className="text-left text-sm">
          <p className="font-medium">
            {booking.schedule.route.origin} →{" "}
            {booking.schedule.route.destination}
          </p>
          <p className="text-muted-foreground">
            {new Intl.DateTimeFormat("en-ET", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date(booking.schedule.departsAt))}
          </p>
          <p className="mt-2">
            Bus {booking.schedule.bus.plateNumber} · Seats{" "}
            {booking.seats.map((s) => s.seatNo).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Print / PDF
          </Button>
          <Button type="button" variant="secondary" onClick={() => void share()}>
            <Share2 className="mr-2 h-4 w-4" aria-hidden />
            Share
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <TicketInner />
    </Suspense>
  );
}
