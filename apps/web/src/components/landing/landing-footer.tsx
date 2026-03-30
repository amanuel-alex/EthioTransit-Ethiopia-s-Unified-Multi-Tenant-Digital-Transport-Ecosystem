"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function LandingFooter() {
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks — we’ll be in touch.");
    setEmail("");
  };

  return (
    <footer id="footer" className="border-t border-white/10 bg-[#030303] py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-xl font-bold text-[hsl(152,65%,48%)]">EthioTransit</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
            Revolutionizing national mobility through digital excellence and kinetic
            efficiency.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Services</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-500">
            <li>
              <Link href="/auth?next=/search" className="hover:text-zinc-300">
                Bus Booking
              </Link>
            </li>
            <li>
              <span className="cursor-default hover:text-zinc-300">Fleet Tracking</span>
            </li>
            <li>
              <span className="cursor-default hover:text-zinc-300">Corporate Travel</span>
            </li>
            <li>
              <Link href="/partners/apply" className="hover:text-zinc-300">
                For operators
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-500">
            <li>
              <a href="mailto:support@ethiotransit.et" className="hover:text-zinc-300">
                Support
              </a>
            </li>
            <li>
              <span className="cursor-default hover:text-zinc-300">Careers</span>
            </li>
            <li>
              <span className="cursor-default hover:text-zinc-300">Privacy Policy</span>
            </li>
            <li>
              <span className="cursor-default hover:text-zinc-300">Terms of Service</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Newsletter</h3>
          <form onSubmit={submit} className="mt-4">
            <div className="flex rounded-full border border-white/10 bg-zinc-900/80 p-1 pl-4 backdrop-blur-sm">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(152,65%,48%)] text-zinc-950 transition-transform hover:scale-105 active:scale-95"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
          <p className="mt-6 text-xs text-zinc-600">
            © {new Date().getFullYear()} EthioTransit. Kinetic Glass Edition.
          </p>
        </div>
      </div>
    </footer>
  );
}
