import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { AuthGate } from "@/components/app/auth-gate";

export const metadata: Metadata = {
  title: "App",
};

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
