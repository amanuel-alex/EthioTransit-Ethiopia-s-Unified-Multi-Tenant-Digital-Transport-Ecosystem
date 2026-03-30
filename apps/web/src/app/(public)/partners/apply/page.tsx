"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

function slugPreview(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PartnerApplyPage() {
  const api = useApi();
  const [legalName, setLegalName] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const slug = useMemo(() => slugPreview(slugInput), [slugInput]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (legalName.trim().length < 2) {
      toast.error("Enter your registered business name.");
      return;
    }
    if (slug.length < 2) {
      toast.error("Choose a URL slug for your company (e.g. sky-bus).");
      return;
    }
    if (phone.trim().length < 5) {
      toast.error("Enter the phone number you will use to sign in.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitPublicOperatorApplication({
        legalName: legalName.trim(),
        slug: slugInput.trim() || slug,
        applicantPhone: phone.trim(),
        applicantEmail: email.trim() || null,
        notes: notes.trim() || null,
      });
      setDoneId(res.id);
      toast.success("Application submitted");
    } catch (err) {
      const e = err as Error & { status?: number };
      toast.error(e.message ?? "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (doneId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center">
          <CheckCircle2
            className="mx-auto h-14 w-14 text-[hsl(152,65%,48%)]"
            aria-hidden
          />
          <h1 className="mt-6 text-2xl font-bold text-white">Application received</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Reference <span className="font-mono text-zinc-300">{doneId}</span>. Our team will
            review your request. When approved, sign in with the phone number you provided at{" "}
            <Link href="/auth" className="text-[hsl(152,65%,52%)] underline">
              Sign in
            </Link>{" "}
            to open your operator dashboard.
          </p>
          <Button asChild className="mt-8 rounded-full" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/#operators"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        For operators
      </Link>

      <div className="mt-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <Building2 className="h-5 w-5 text-[hsl(152,65%,48%)]" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Apply as a bus operator
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Submit one application per company. After approval you will use the phone number below
            to log in and configure fleet, routes, and schedules.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="legalName" className="text-zinc-300">
            Legal / brand name
          </Label>
          <Input
            id="legalName"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="e.g. Zemen Bus Services PLC"
            className="border-white/15 bg-zinc-900/50 text-white placeholder:text-zinc-600"
            autoComplete="organization"
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-zinc-300">
            Public slug
          </Label>
          <Input
            id="slug"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="your-company-slug"
            className="border-white/15 bg-zinc-900/50 font-mono text-sm text-white placeholder:text-zinc-600"
            autoComplete="off"
            required
            maxLength={48}
          />
          <p className="text-xs text-zinc-500">
            Used in URLs and search. Normalized to:{" "}
            <span className="font-mono text-zinc-400">{slug || "—"}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-300">
            Primary phone (sign-in)
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+2519… or 09…"
            className="border-white/15 bg-zinc-900/50 text-white placeholder:text-zinc-600"
            autoComplete="tel"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300">
            Contact email (optional)
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ops@example.com"
            className="border-white/15 bg-zinc-900/50 text-white placeholder:text-zinc-600"
            autoComplete="email"
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-zinc-300">
            Routes &amp; fleet notes (optional)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Main corridors, approximate fleet size, trade license ref…"
            rows={4}
            maxLength={2000}
            className={cn(
              "flex min-h-[100px] w-full resize-y rounded-md border px-3 py-2 text-sm ring-offset-background",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "border-white/15 bg-zinc-900/50 text-white placeholder:text-zinc-600",
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[hsl(152,65%,46%)] text-white hover:bg-[hsl(152,65%,40%)] sm:w-auto"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </Button>

        <p className="text-xs leading-relaxed text-zinc-500">
          By submitting you agree that EthioTransit may verify your business before activation.
          Questions?{" "}
          <Link href="/#contact" className="text-[hsl(152,65%,52%)] underline">
            Contact us
          </Link>{" "}
          and choose <strong className="text-zinc-400">Operators &amp; partnerships</strong>.
        </p>
      </form>
    </div>
  );
}
