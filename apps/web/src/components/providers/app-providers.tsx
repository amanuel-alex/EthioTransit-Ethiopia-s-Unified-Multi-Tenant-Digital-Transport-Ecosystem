"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/auth-context";
import { TenantProvider } from "@/lib/tenant/tenant-context";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TenantProvider>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
