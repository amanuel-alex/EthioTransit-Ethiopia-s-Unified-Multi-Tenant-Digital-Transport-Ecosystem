"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bus,
  CalendarDays,
  Crosshair,
  MapPin,
  Navigation,
  Search,
  Shield,
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
import { LandingFooter } from "./landing-footer";
import { PlexusGraphic } from "./plexus-graphic";

const partners: { name: string; icon: typeof Bus }[] = [
  { name: "Sky Bus", icon: Bus },
  { name: "Selam Bus", icon: Bus },
  { name: "Lul Bus", icon: Navigation },
  { name: "Golden Bus", icon: Bus },
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
              "radial-gradient(ellipse 90% 60% at 50% -10%, hsl(152 50% 20% / 0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, hsl(152 40% 15% / 0.2), transparent 50%), #050505",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-12 text-center sm:px-6 sm:pt-16 md:pt-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.5rem] lg:leading-[1.08]">
              Book Bus Tickets Across{" "}
              <span className="bg-gradient-to-r from-[hsl(152,72%,46%)] to-[hsl(152,55%,58%)] bg-clip-text text-transparent">
                Ethiopia Instantly
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              The premium gateway to intercity travel. Connecting Addis Ababa to
              the horizon with luxury, security, and real-time tracking.
            </p>
          </motion.div>

          <motion.form
            onSubmit={onSearch}
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 w-full max-w-4xl space-y-5"
          >
            <div
              className={cn(
                "flex flex-col gap-3 rounded-[2rem] border border-white/[0.12] bg-white/[0.06] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl lg:flex-row lg:items-stretch lg:gap-0 lg:p-2 lg:pl-2",
              )}
            >
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center lg:gap-0">
                <div className="flex min-h-[4.5rem] flex-1 flex-col justify-center border-b border-white/10 px-4 py-2 sm:border-b-0 lg:border-r lg:py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(48,96%,58%)]">
                    From
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                      strokeWidth={2}
                    />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-left text-sm font-medium text-white outline-none placeholder:text-zinc-600"
                      placeholder="City"
                      required
                      aria-label="From"
                    />
                  </div>
                </div>
                <div className="flex min-h-[4.5rem] flex-1 flex-col justify-center border-b border-white/10 px-4 py-2 sm:border-b-0 lg:border-r lg:py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(48,96%,58%)]">
                    To
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Navigation
                      className="h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                      strokeWidth={2}
                    />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-left text-sm font-medium text-white outline-none placeholder:text-zinc-600"
                      placeholder="City"
                      required
                      aria-label="To"
                    />
                  </div>
                </div>
                <div className="flex min-h-[4.5rem] flex-1 flex-col justify-center px-4 py-2 lg:py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(48,96%,58%)]">
                    Date
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 text-[hsl(152,65%,48%)]"
                      strokeWidth={2}
                    />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full min-w-0 cursor-pointer bg-transparent text-sm font-medium text-white outline-none [color-scheme:dark] md:max-w-[12rem]"
                      aria-label="Travel date"
                    />
                  </div>
                </div>
              </div>
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="shrink-0 lg:self-center lg:pl-2"
              >
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full border-0 bg-[hsl(152,65%,44%)] px-8 text-base font-semibold text-zinc-950 shadow-[0_0_32px_-6px_hsl(152,65%,45%)] hover:bg-[hsl(152,65%,50%)] lg:h-14 lg:w-auto"
                >
                  <Search className="mr-2 h-5 w-5" strokeWidth={2.25} />
                  Find Routes
                </Button>
              </motion.div>
            </div>

            <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-left text-xs text-zinc-500">
                Operator required for search.{" "}
                <Link href="/auth" className="text-[hsl(152,65%,48%)] underline">
                  Sign in
                </Link>{" "}
                after picking a route.
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

      {/* Official partners */}
      <MotionSection className="border-y border-white/5 bg-[#080808] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-600">
            Official partners
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
              <div
                className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"
                aria-hidden
              />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(152 30% 12%) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsl(152 40% 25% / 0.4), transparent 50%)",
                }}
                aria-hidden
              />
              <Bus
                className="absolute -right-4 bottom-8 h-48 w-48 text-white/[0.07] sm:h-64 sm:w-64"
                strokeWidth={0.5}
                aria-hidden
              />
              <div className="relative">
                <span className="inline-flex rounded-xl bg-[hsl(152,65%,48%)]/20 p-2.5 text-[hsl(152,65%,48%)]">
                  <Shield className="h-6 w-6" strokeWidth={2} />
                </span>
                <h2 className="mt-6 max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Secured Transactions &amp; Travel Insurance
                </h2>
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
                <h3 className="text-xl font-bold text-white">Instant Booking</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  Lock seats in seconds with live availability, M-Pesa, and Chapa —
                  built for Ethiopian corridors.
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
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 rounded-full border-0 bg-white px-6 font-semibold text-zinc-950 hover:bg-zinc-100"
                    onClick={() => router.push("/auth")}
                  >
                    App Store
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/5"
                    onClick={() => router.push("/auth")}
                  >
                    Google Play
                  </Button>
                </div>
              </div>
              <div className="relative min-h-[240px] border-t border-white/5 md:border-l md:border-t-0">
                <PlexusGraphic />
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <LandingFooter />
    </div>
  );
}
