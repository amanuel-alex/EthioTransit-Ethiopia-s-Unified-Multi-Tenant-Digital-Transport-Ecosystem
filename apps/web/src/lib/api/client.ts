/**
 * HTTP client for the EthioTransit **Express API** (`apps/api`).
 * Browser requests use `NEXT_PUBLIC_API_URL` when set; in `next dev`, missing values
 * default to `http://localhost:4000` (see `apps/web/.env.example`).
 */
import type { AuthUser } from "./types";

const DEFAULT_DEV_API_ORIGIN = "http://localhost:4000";

export type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

/** Resolved API origin (no trailing slash). Throws in production if unset. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_DEV_API_ORIGIN;
  }
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.",
  );
}

function getBaseUrl(): string {
  return getApiBaseUrl();
}

export type ApiRequestAuth = {
  accessToken: string | null;
  companyId: string | null;
  user: AuthUser | null;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown; auth: ApiRequestAuth },
): Promise<T> {
  const { json, auth, headers: initHeaders, ...rest } = init;
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(initHeaders);
  if (auth.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  const role = auth.user?.role;
  const effectiveTenant =
    role === "COMPANY" && auth.user?.companyId
      ? auth.user.companyId
      : auth.companyId;

  if (effectiveTenant && (role === "PASSENGER" || role === "COMPANY")) {
    headers.set("x-company-id", effectiveTenant);
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    rest.body = JSON.stringify(json);
  }

  const res = await fetch(url, { ...rest, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const body = data as ApiErrorBody;
    const msg =
      body?.message ?? body?.error ?? res.statusText ?? "Request failed";
    const err = new Error(msg) as Error & {
      status: number;
      body: unknown;
      code?: string;
    };
    err.status = res.status;
    err.body = data;
    err.code = body?.code;
    throw err;
  }

  return data as T;
}

export async function loginRequest(phone: string, code: string) {
  return apiRequest<import("./types").LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    json: { phone, code },
    auth: { accessToken: null, companyId: null, user: null },
  });
}

export async function refreshRequest(refreshToken: string) {
  return apiRequest<import("./types").RefreshResponse>("/api/v1/auth/refresh", {
    method: "POST",
    json: { refreshToken },
    auth: { accessToken: null, companyId: null, user: null },
  });
}
