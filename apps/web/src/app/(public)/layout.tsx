import type { Metadata } from "next";
import { PublicNav } from "@/components/landing/public-nav";

export const metadata: Metadata = {
  title: "EthioTransit — Book intercity buses",
  description:
    "Search routes, pick seats, and pay with M-Pesa or Chapa across Ethiopian operators.",
  openGraph: {
    title: "EthioTransit",
    description: "Ethiopia’s unified multi-tenant digital transport ecosystem.",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 antialiased">
      <PublicNav />
      {children}
    </div>
  );
}
