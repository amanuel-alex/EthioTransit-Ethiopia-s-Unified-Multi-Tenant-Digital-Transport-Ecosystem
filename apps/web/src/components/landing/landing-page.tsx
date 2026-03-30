"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Bus,
  CalendarDays,
  Crosshair,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MotionSection } from "@/components/shared/motion-section";
import { getOperatorPresets } from "@/lib/operators";
import { useTenant } from "@/lib/tenant/tenant-context";
import { cn } from "@/lib/utils";
import {
  AppStoreBadgeButton,
  GooglePlayBadgeButton,
} from "./download-badges";
import { ContactSection } from "./contact-section";
import { LandingFooter } from "./landing-footer";
import { PlexusGraphic } from "./plexus-graphic";

const partners: { name: string; icon: typeof Bus }[] = [
  { name: "Sky Bus", icon: Bus },
  { name: "Selam Bus", icon: Bus },
  { name: "Lul Bus", icon: Navigation },
  { name: "Golden Bus", icon: Bus },
  { name: "Zemen Bus", icon: Bus },
  { name: "Abay Lines", icon: Bus },
];

const operatorOnboardingSteps: {
  step: string;
  title: string;
  body: string;
}[] = [
  {
    step: "01",
    title: "Apply online",
    body: "Submit the partner form with your legal name, a URL slug for your brand (e.g. sky-bus or your-company), and the phone number you will use to sign in.",
  },
  {
    step: "02",
    title: "We review & approve",
    body: "Platform admins verify your application. Approval instantly creates your company tenant and links your phone as the operator account.",
  },
  {
    step: "03",
    title: "You configure fleet & schedules",
    body: "In the operator dashboard you add buses, drivers, routes, and trip schedules. Passengers discover your trips in search alongside other partners.",
  },
  {
    step: "04",
    title: "Go live on payments",
    body: "Bookings settle through platform rail (M-Pesa / Chapa). You see revenue, commissions, and can suspend routes when needed—admins oversee the network.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { setCompanyId } = useTenant();
  const presets = getOperatorPresets();
  const [origin, setOrigin] = useState("Addis Ababa");
  const [destination, setDestination] = useState("Hawassa");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [operatorId, setOperatorId] = useState(() => presets[0]?.id ?? "");
  const [customId, setCustomId] = useState("");

  const dateLabel = useMemo(() => {
    const d = new Date(`${date}T12:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [date]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const company = customId.trim() || operatorId;
    if (!company) {
      return;
    }
    setCompanyId(company);
    const q = new URLSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
      date,
    });
    router.push(`/search?${q.toString()}`);
  };

  return (
    <div className="bg-[#050505] text-zinc-100">
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 85% 55% at 50% 15%, hsl(152 65% 32% / 0.28), transparent 58%), radial-gradient(ellipse 70% 50% at 50% 85%, hsl(152 55% 25% / 0.12), transparent 55%), #050505",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-10 text-center sm:px-6 sm:pt-14 md:pt-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.45rem] lg:leading-[1.1]">
              <span className="text-white">Book Bus Tickets Across </span>
              <span className="text-[hsl(152,72%,48%)]">Ethiopia Instantly</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg sm:leading-relaxed">
              The premium gateway to intercity travel. Connecting Addis Ababa to
              the horizon with luxury, security, and real-time tracking.
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 w-full max-w-5xl sm:mt-12"
          >
            <div className="relative aspect-[16/10] max-h-[min(22rem,52vh)] w-full overflow-hidden rounded-[1.75rem] border border-white/[0.12] shadow-[0_28px_64px_-18px_rgba(0,0,0,0.75)] sm:aspect-[21/9] sm:max-h-[min(20rem,45vh)]">
              <Image
                src="/landing-bus.jpg"
                alt="Intercity coach at dusk, mountains in the background"
                fill
                className="object-cover object-[center_42%]"
                priority
                sizes="(max-width: 1024px) 100vw, 56rem"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505]/50 via-transparent to-transparent sm:from-[#050505]/35"
                aria-hidden
              />
            </div>
          </motion.div>

          <motion.form
            onSubmit={onSearch}
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 w-full max-w-4xl space-y-4 sm:mt-12"
          >
            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.14] bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:flex-row lg:items-center lg:rounded-full lg:py-1.5 lg:pl-3 lg:pr-2",
              )}
            >
              <div className="flex flex-1 flex-col lg:flex-row lg:items-stretch">
                <div className="flex min-h-[4.25rem] flex-1 flex-col justify-center border-b border-white/[0.1] px-5 py-3 lg:min-h-0 lg:border-b-0 lg:border-r lg:border-white/[0.12] lg:py-3.5">
                  <span className="text-left text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(48,96%,56%)]">
                    From
                  </span>
                  <div className="mt-1 flex items-center gap-2.5">
                    <MapPin
                      className="h-4 w-4 shrink-0 text-[hsl(152,70%,50%)]"
                      strokeWidth={2.25}
                    />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-left text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                      placeholder="Addis Ababa"
                      required
                      aria-label="From"
                    />
                  </div>
                </div>
                <div className="flex min-h-[4.25rem] flex-1 flex-col justify-center border-b border-white/[0.1] px-5 py-3 lg:min-h-0 lg:border-b-0 lg:border-r lg:border-white/[0.12] lg:py-3.5">
                  <span className="text-left text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(48,96%,56%)]">
                    To
                  </span>
                  <div className="mt-1 flex items-center gap-2.5">
                    <Navigation
                      className="h-4 w-4 shrink-0 text-[hsl(152,70%,50%)]"
                      strokeWidth={2.25}
                    />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-left text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                      placeholder="Hawassa"
                      required
                      aria-label="To"
                    />
                  </div>
                </div>
                <div className="relative flex min-h-[4.25rem] flex-1 cursor-pointer flex-col justify-center px-5 py-3 lg:min-h-0 lg:py-3.5">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    aria-label="Travel date"
                  />
                  <span className="pointer-events-none text-left text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(48,96%,56%)]">
                    Date
                  </span>
                  <div className="pointer-events-none mt-1 flex min-h-[1.5rem] items-center gap-2.5">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 text-[hsl(152,70%,50%)]"
                      strokeWidth={2.25}
                    />
                    <span className="text-left text-sm font-semibold tabular-nums text-white">
                      {dateLabel}
                    </span>
                  </div>
                </div>
              </div>
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="shrink-0 p-3 pt-0 lg:p-2 lg:pl-3"
              >
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full border-0 bg-[hsl(152,66%,44%)] px-8 text-base font-semibold text-zinc-950 shadow-[0_0_36px_-6px_hsl(152,72%,42%),0_0_20px_-4px_hsl(152,80%,35%)] transition-shadow hover:bg-[hsl(152,66%,50%)] hover:shadow-[0_0_40px_-4px_hsl(152,72%,48%)] lg:h-[3.25rem] lg:min-w-[10.5rem]"
                >
                  <Search className="mr-2 h-5 w-5" strokeWidth={2.35} />
                  Find Routes
                </Button>
              </motion.div>
            </div>

            <div className="mx-auto flex max-w-4xl flex-col gap-2.5 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2.5">
              <p className="text-left text-[11px] leading-snug text-zinc-500 sm:max-w-[55%]">
                Operator tenant for search API.{" "}
                <Link
                  href="/auth"
                  className="font-medium text-[hsl(152,68%,50%)] underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>{" "}
                for saved bookings.
              </p>
              <div className="flex w-full flex-col gap-2 sm:max-w-xs">
                {presets.length > 0 ? (
                  <Select
                    value={operatorId}
                    onValueChange={(v) => {
                      setOperatorId(v);
                      setCustomId("");
                    }}
                  >
                    <SelectTrigger className="h-9 border-white/10 bg-zinc-900/80 text-xs text-white">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <input
                  placeholder="Company ID (from seed / Prisma)"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="h-9 rounded-md border border-white/10 bg-zinc-900/80 px-3 text-xs text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-[hsl(152,65%,48%)]/40"
                />
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Operator ecosystem (illustrative names) */}
      <MotionSection className="border-y border-white/5 bg-[#080808] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-600">
            Built for many operators
          </p>
          <p className="mx-auto mt-2 max-w-xl text-center text-xs text-zinc-500">
            One platform, separate tenant per company—national fleets, regional lines, and new brands
            welcome. Below are example names; your logo and routes appear the same way.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {partners.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex items-center gap-3 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* Bento features */}
      <MotionSection id="features" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-8 lg:col-span-7 lg:row-span-2"
            >
              <div className="absolute inset-0" aria-hidden>
                <Image
                  src="/landing-bus.jpg"
                  alt=""
                  fill
                  className="object-cover object-[center_38%]"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/35"
                aria-hidden
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(125deg, hsl(152 28% 10%) 0%, transparent 42%), radial-gradient(ellipse 90% 60% at 100% 0%, hsl(28 85% 45% / 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 20% 15%, hsl(200 40% 35% / 0.12), transparent 50%)",
                }}
                aria-hidden
              />
              <div className="relative">
                <span className="inline-flex rounded-xl bg-[hsl(152,65%,46%)] p-2.5 text-white shadow-[0_0_24px_-8px_hsl(152,72%,42%)]">
                  <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
                </span>
                <h2 className="mt-6 max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Secured Transactions &amp; Travel Insurance
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                  Every booking is encrypted with fintech-grade security and
                  includes a mandatory travel safety coverage for peace of mind.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0c0c0c] p-8 lg:col-span-5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(48,96%,58%)]/15 text-[hsl(48,96%,58%)]">
                <Crosshair className="h-6 w-6" strokeWidth={2} />
              </span>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white">
                  Real-time Fleet Tracking
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  Track your bus location in real-time. Share your ETA with loved
                  ones via a secure link.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0c0c0c] p-8 lg:col-span-5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(0,72%,51%)]/15 text-[hsl(0,72%,58%)]">
                <Zap className="h-6 w-6" strokeWidth={2} />
              </span>
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white">Instant Ticketing</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  Zero queue wait times. Book and receive your digital ticket via{" "}
                  <strong className="font-semibold text-zinc-300">SMS and Email</strong>{" "}
                  in 60 seconds.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Search & compare",
                body: "Routes and operators in one flow.",
              },
              {
                icon: Bus,
                title: "Pick your seat",
                body: "Live seat map with clear states.",
              },
              {
                icon: Sparkles,
                title: "Pay your way",
                body: "M-Pesa STK and Chapa checkout.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10"
              >
                <f.icon className="h-6 w-6 text-[hsl(152,65%,48%)]" />
                <h4 className="mt-4 font-semibold text-white">{f.title}</h4>
                <p className="mt-2 text-sm text-zinc-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* Operators / B2B partnership */}
      <MotionSection
        id="operators"
        className="scroll-mt-24 border-t border-white/5 bg-[#070707] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[hsl(152,65%,52%)]">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                For operators
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                When your org joins EthioTransit
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                <strong className="font-medium text-zinc-300">
                  Every bus company gets its own tenant
                </strong>
                —national brands, regional lines, and new operators alike. Partner through onboarding, not
                a passenger signup form. You keep your brand and fleet; we provide search, seats,
                ticketing, and payouts on one shared rail.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full bg-[hsl(152,65%,46%)] text-white hover:bg-[hsl(152,65%,40%)]"
              >
                <Link href="/partners/apply">Apply as operator</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/20 bg-transparent text-zinc-200 hover:bg-white/5"
              >
                <Link href="/auth">Operator sign in</Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {operatorOnboardingSteps.map((s) => (
              <motion.div
                key={s.step}
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <p className="font-mono text-xs font-semibold tabular-nums text-[hsl(152,65%,48%)]">
                  {s.step}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.body}</p>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500 sm:text-left">
            In{" "}
            <Link
              href="/#contact"
              className="font-medium text-[hsl(152,65%,52%)] underline decoration-[hsl(152,65%,48%)]/40 underline-offset-2 hover:decoration-[hsl(152,65%,48%)]"
            >
              Contact
            </Link>
            , choose <strong className="text-zinc-400">Operators &amp; partnerships</strong> so your
            message routes to the right inbox.
          </p>
        </div>
      </MotionSection>

      {/* App CTA */}
      <MotionSection className="pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-900/90 to-[#060606]">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  The Future of Ethiopian Transit.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Experience a seamless journey from booking to boarding. Download
                  the EthioTransit app for exclusive early-bird discounts and luxury
                  seat selection.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <AppStoreBadgeButton onClick={() => router.push("/auth")} />
                  <GooglePlayBadgeButton onClick={() => router.push("/auth")} />
                </div>
              </div>
              <div className="relative min-h-[240px] border-t border-white/5 bg-[hsl(152,28%,7%)] md:border-l md:border-t-0">
                <PlexusGraphic />
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <ContactSection />

      <LandingFooter />
    </div>
  );
}
