import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api/client";
import type { ApiErrorBody } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";
import {
  SESSION_ACCESS,
  SESSION_USER_JSON,
} from "@/lib/server/session-cookies";

function parseUser(raw: string | undefined): AuthUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Authenticated fetch to the Express API from Server Actions / RSC. */
export async function serverApiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const jar = await cookies();
  const token = jar.get(SESSION_ACCESS)?.value ?? null;
  const user = parseUser(jar.get(SESSION_USER_JSON)?.value);

  const { json, headers: initHeaders, ...rest } = init;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(initHeaders);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const role = user?.role;
  const effectiveTenant =
    role === "COMPANY" && user?.companyId ? user.companyId : null;

  if (effectiveTenant && (role === "PASSENGER" || role === "COMPANY")) {
    headers.set("x-company-id", effectiveTenant);
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    (rest as RequestInit).body = JSON.stringify(json);
  }

  const res = await fetch(url, { ...rest, headers, cache: "no-store" });
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
