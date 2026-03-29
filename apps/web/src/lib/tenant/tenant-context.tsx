"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";

const LS_COMPANY = "ethiotransit_company_id";

type TenantContextValue = {
  /** Effective tenant for x-company-id (passenger selection or company user). */
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (user?.role === "COMPANY" && user.companyId) {
      setSelectedId(null);
      return;
    }
    if (typeof window === "undefined") return;
    const fromLs = localStorage.getItem(LS_COMPANY);
    const def = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID?.trim();
    setSelectedId(fromLs ?? def ?? null);
  }, [authReady, user?.role, user?.companyId]);

  const setCompanyId = useCallback((id: string | null) => {
    setSelectedId(id);
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(LS_COMPANY, id);
    else localStorage.removeItem(LS_COMPANY);
  }, []);

  const companyId = useMemo(() => {
    if (user?.role === "COMPANY") return user.companyId ?? null;
    return selectedId;
  }, [user?.role, user?.companyId, selectedId]);

  const value = useMemo(
    () => ({ companyId, setCompanyId }),
    [companyId, setCompanyId],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
