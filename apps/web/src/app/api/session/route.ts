import { NextResponse } from "next/server";
import type { AuthUser } from "@/lib/api/types";
import {
  SESSION_ACCESS,
  SESSION_COOKIE_BASE,
  SESSION_REFRESH,
  SESSION_USER_JSON,
} from "@/lib/server/session-cookies";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as {
    accessToken?: string;
    refreshToken?: string;
    user?: AuthUser;
  };

  if (!b.accessToken || !b.refreshToken || !b.user) {
    return NextResponse.json(
      { ok: false, error: "missing_tokens_or_user" },
      { status: 400 },
    );
  }

  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  const opts = { ...SESSION_COOKIE_BASE, secure };

  res.cookies.set(SESSION_ACCESS, b.accessToken, opts);
  res.cookies.set(SESSION_REFRESH, b.refreshToken, opts);
  res.cookies.set(SESSION_USER_JSON, JSON.stringify(b.user), {
    ...opts,
    maxAge: SESSION_COOKIE_BASE.maxAge,
  });

  return res;
}

export async function DELETE() {
  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  const clear = { ...SESSION_COOKIE_BASE, maxAge: 0, secure };

  res.cookies.set(SESSION_ACCESS, "", clear);
  res.cookies.set(SESSION_REFRESH, "", clear);
  res.cookies.set(SESSION_USER_JSON, "", clear);

  return res;
}
