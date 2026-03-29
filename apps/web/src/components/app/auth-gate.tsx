"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { ready, accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fullPath = useMemo(() => {
    const q = searchParams.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      const next = encodeURIComponent(fullPath || "/home");
      router.replace(`/auth?next=${next}`);
    }
  }, [ready, accessToken, fullPath, router]);

  if (!ready || !accessToken) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthGateInner>{children}</AuthGateInner>
    </Suspense>
  );
}
