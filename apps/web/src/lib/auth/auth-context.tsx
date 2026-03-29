"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loginRequest, refreshRequest } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

const STORAGE_KEY = "ethiotransit_auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  ready: boolean;
  login: (phone: string, code: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  setSession: (next: AuthState) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null, user: null };
    const p = JSON.parse(raw) as AuthState;
    return {
      accessToken: p.accessToken ?? null,
      refreshToken: p.refreshToken ?? null,
      user: p.user ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

function persist(next: AuthState) {
  if (typeof window === "undefined") return;
  if (next.accessToken && next.refreshToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readStored());
    setReady(true);
  }, []);

  const setSession = useCallback((next: AuthState) => {
    setState(next);
    persist(next);
  }, []);

  const logout = useCallback(() => {
    setSession({ accessToken: null, refreshToken: null, user: null });
  }, [setSession]);

  const login = useCallback(
    async (phone: string, code: string) => {
      const out = await loginRequest(phone, code);
      setSession({
        accessToken: out.accessToken,
        refreshToken: out.refreshToken,
        user: out.user,
      });
      return out.user;
    },
    [setSession],
  );

  const refresh = useCallback(async () => {
    const rt = state.refreshToken;
    if (!rt) return false;
    try {
      const out = await refreshRequest(rt);
      setSession({
        accessToken: out.accessToken,
        refreshToken: out.refreshToken,
        user: state.user,
      });
      return true;
    } catch {
      logout();
      return false;
    }
  }, [state.refreshToken, state.user, setSession, logout]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      login,
      logout,
      refresh,
      setSession,
    }),
    [state, ready, login, logout, refresh, setSession],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
