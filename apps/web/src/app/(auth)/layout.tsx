import type { Metadata } from "next";
import Link from "next/link";
import { Bus } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Phone verification for EthioTransit passengers and operators.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Bus className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">{children}</div>
    </div>
  );
}
