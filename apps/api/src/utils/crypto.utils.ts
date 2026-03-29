import { randomBytes, timingSafeEqual, createHmac } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
