import type { Request } from "express";

/** First hop client IP (use with trust proxy behind a load balancer). */
export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    return xff.split(",")[0]?.trim() ?? "";
  }
  if (Array.isArray(xff) && xff[0]) {
    return xff[0].split(",")[0]?.trim() ?? "";
  }
  return req.ip ?? req.socket.remoteAddress ?? "";
}

export function ipAllowed(clientIp: string, allowlistCsv: string | undefined): boolean {
  if (!allowlistCsv?.trim()) return true;
  const allowed = allowlistCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.some((a) => clientIp === a || clientIp.endsWith(a));
}
