"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { PaymentMethodButtons } from "@/components/booking/payment-method-buttons";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import {
  readCheckoutDraft,
  type CheckoutDraft,
} from "@/lib/booking/checkout-storage";

export default function CheckoutPage() {
  const router = useRouter();
  const api = useApi();
  const { logout } = useAuth();
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [chapaEmail, setChapaEmail] = useState("");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [chapaLoading, setChapaLoading] = useState(false);

  useEffect(() => {
    const d = readCheckoutDraft();
    if (!d) {
      toast.error("No active checkout");
      router.replace("/search");
      return;
    }
    setDraft(d);
  }, [router]);

  const payMpesa = async () => {
    if (!draft || !mpesaPhone.trim()) {
      toast.error("Enter M-Pesa phone number");
      return;
    }
    setMpesaLoading(true);
    try {
      await api.initiateMpesa(draft.bookingId, mpesaPhone.trim());
      toast.success("STK push sent — check your phone");
      router.push(`/ticket?bookingId=${encodeURIComponent(draft.bookingId)}`);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "M-Pesa initiation failed");
    } finally {
      setMpesaLoading(false);
    }
  };

  const payChapa = async () => {
    if (!draft || !chapaEmail.trim()) {
      toast.error("Enter email for Chapa");
      return;
    }
    setChapaLoading(true);
    try {
      const out = await api.initiateChapa(draft.bookingId, chapaEmail.trim());
      toast.success("Opening Chapa checkout…");
      window.open(out.checkoutUrl, "_blank", "noopener,noreferrer");
      router.push(`/ticket?bookingId=${encodeURIComponent(draft.bookingId)}`);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Chapa initiation failed");
    } finally {
      setChapaLoading(false);
    }
  };

  if (!draft) return null;

  return (
    <div>
      <PageHeader
        title="Checkout"
        description="Confirm your trip and pay securely."
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? false : { opacity: 1, y: 0 }}
        className="grid gap-8 lg:grid-cols-2"
      >
        <GlassCard className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Trip summary</h2>
          <p className="text-sm text-muted-foreground">{draft.routeLabel}</p>
          <p className="text-sm">
            Departs{" "}
            {new Intl.DateTimeFormat("en-ET", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(draft.departsAt))}
          </p>
          <p className="text-sm">
            Seats: {draft.seatNumbers.join(", ")}
          </p>
          <p className="text-2xl font-semibold">
            {draft.totalAmount} {draft.currency}
          </p>
        </GlassCard>
        <div className="space-y-6">
          <GlassCard className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Passenger contact</h2>
            <div className="space-y-2">
              <Label htmlFor="mpesa">M-Pesa phone</Label>
              <Input
                id="mpesa"
                placeholder="2547… or 07…"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Chapa)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={chapaEmail}
                onChange={(e) => setChapaEmail(e.target.value)}
              />
            </div>
          </GlassCard>
          <PaymentMethodButtons
            onMpesa={() => void payMpesa()}
            onChapa={() => void payChapa()}
            mpesaLoading={mpesaLoading}
            chapaLoading={chapaLoading}
          />
        </div>
      </motion.div>
    </div>
  );
}
