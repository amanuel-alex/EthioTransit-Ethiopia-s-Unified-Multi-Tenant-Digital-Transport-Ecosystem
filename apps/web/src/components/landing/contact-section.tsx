"use client";

import { useState } from "react";
import { Bus, Clock, Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
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
import { MotionSection } from "@/components/shared/motion-section";
import { cn } from "@/lib/utils";

const TOPICS = [
  { value: "support", label: "Passenger support", email: "support@ethiotransit.et" },
  {
    value: "partners",
    label: "Operators & partnerships",
    email: "partners@ethiotransit.et",
  },
  { value: "general", label: "General inquiry", email: "support@ethiotransit.et" },
] as const;

function emailLooksValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]!.value);
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();
    if (!n || !em || !msg) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    if (!emailLooksValid(em)) {
      toast.error("Enter a valid email address.");
      return;
    }

    const meta = TOPICS.find((t) => t.value === topic) ?? TOPICS[0]!;
    const subject = `[EthioTransit] ${meta.label}: ${n}`;
    const body = `Name: ${n}\nEmail: ${em}\nTopic: ${meta.label}\n\n${msg}`;
    const href = `mailto:${meta.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (href.length > 1900) {
      toast.error("Message is too long for your email app. Shorten it or email us directly.");
      return;
    }

    window.location.href = href;
    toast.success("Opening your email app…", {
      description: `Send the draft to ${meta.email} if it does not open automatically.`,
    });
  };

  return (
    <MotionSection
      id="contact"
      className="scroll-mt-28 border-t border-white/5 bg-[#060606] py-16 sm:scroll-mt-24 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Contact us
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              Questions about bookings, operators, or the platform? Send a message or
              reach us directly—we aim to respond within one business day.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(152,68%,52%)]" />
                <div>
                  <p className="text-sm font-medium text-white">Hours</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Monday–Friday, 9:00–17:30 EAT (excluding public holidays)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(152,68%,52%)]" />
                <div>
                  <p className="text-sm font-medium text-white">Office</p>
                  <p className="mt-0.5 text-sm text-zinc-500">Addis Ababa, Ethiopia</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-3">
              <a
                href="mailto:support@ethiotransit.et"
                className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[hsl(152,65%,48%)]/35 hover:bg-white/[0.05]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(152,65%,48%)]/15 text-[hsl(152,68%,52%)]">
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Support</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500 group-hover:text-zinc-400">
                    support@ethiotransit.et
                  </p>
                  <p className="mt-1.5 text-xs text-zinc-600 leading-snug">
                    Bookings, refunds, accounts
                  </p>
                </div>
              </a>
              <a
                href="mailto:partners@ethiotransit.et"
                className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[hsl(152,65%,48%)]/35 hover:bg-white/[0.05]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
                  <Bus className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Partnerships</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500 group-hover:text-zinc-400">
                    partners@ethiotransit.et
                  </p>
                  <p className="mt-1.5 text-xs text-zinc-600 leading-snug">
                    Fleet, API, B2B
                  </p>
                </div>
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Send a message</h3>
            <p className="mt-1 text-sm text-zinc-500">
              We&apos;ll open your email with a draft you can edit before sending.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-zinc-300">
                  Name
                </Label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="border-white/10 bg-zinc-900/80 text-white placeholder:text-zinc-600 focus-visible:ring-[hsl(152,65%,48%)]/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-white/10 bg-zinc-900/80 text-white placeholder:text-zinc-600 focus-visible:ring-[hsl(152,65%,48%)]/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-topic" className="text-zinc-300">
                  Topic
                </Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger
                    id="contact-topic"
                    className="border-white/10 bg-zinc-900/80 text-white focus:ring-[hsl(152,65%,48%)]/40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-zinc-300">
                  Message
                </Label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className={cn(
                    "flex min-h-[120px] w-full rounded-md border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white placeholder:text-zinc-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(152,65%,48%)]/40",
                  )}
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-[hsl(152,66%,44%)] font-semibold text-zinc-950 shadow-[0_0_24px_-8px_hsl(152,72%,42%)] hover:bg-[hsl(152,66%,50%)] sm:w-auto sm:px-10"
              >
                <Send className="mr-2 h-4 w-4" strokeWidth={2.25} />
                Continue in email
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
