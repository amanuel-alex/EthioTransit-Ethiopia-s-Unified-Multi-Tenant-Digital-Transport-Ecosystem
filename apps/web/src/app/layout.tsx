import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "EthioTransit — Ethiopia’s unified transport booking",
    template: "%s · EthioTransit",
  },
  description:
    "Book intercity bus seats, pay with M-Pesa or Chapa, and travel with trusted Ethiopian operators.",
  openGraph: {
    title: "EthioTransit",
    description:
      "Multi-tenant digital transport ecosystem for passengers and operators.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
