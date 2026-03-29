import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().default("15m"),
    JWT_REFRESH_EXPIRES: z.string().default("7d"),
    CORS_ORIGIN: z.string().optional(),
    SEAT_LOCK_TTL_MINUTES: z.coerce.number().positive().default(15),
    AUTH_DEV_BYPASS: z
      .string()
      .optional()
      .transform((v) => v === "true" || v === "1"),
    AUTH_DEV_CODE: z.string().default("123456"),
    CHAPA_WEBHOOK_SECRET: z.string().optional(),
    /** When true, Chapa webhook payloads are rejected (M-Pesa-only deployments). */
    CHAPA_WEBHOOKS_DISABLED: z
      .string()
      .optional()
      .transform((v) => v === "true" || v === "1"),
    /**
     * If set, M-Pesa webhook must include header `X-EthioTransit-Mpesa-Webhook-Secret` with this value
     * (typically injected by your reverse proxy / API gateway in front of Safaricom callbacks).
     */
    MPESA_WEBHOOK_SECRET: z.string().optional(),
    /** Comma-separated IPs (or suffix match, e.g. 197.248.) allowed to call M-Pesa webhook when set. */
    MPESA_WEBHOOK_IP_ALLOWLIST: z.string().optional(),
    /**
     * When true, skip production webhook hard checks (never use in public production).
     */
    WEBHOOK_INSECURE_ALLOW: z
      .string()
      .optional()
      .transform((v) => v === "true" || v === "1"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && data.AUTH_DEV_BYPASS === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "AUTH_DEV_BYPASS cannot be enabled when NODE_ENV=production. Use real SMS/OTP.",
        path: ["AUTH_DEV_BYPASS"],
      });
    }
    if (data.NODE_ENV === "production" && !data.CORS_ORIGIN?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "CORS_ORIGIN is required in production (comma-separated allowed origins).",
        path: ["CORS_ORIGIN"],
      });
    }
    if (
      data.NODE_ENV === "production" &&
      !data.CHAPA_WEBHOOK_SECRET?.trim() &&
      !data.CHAPA_WEBHOOKS_DISABLED &&
      !data.WEBHOOK_INSECURE_ALLOW
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "CHAPA_WEBHOOK_SECRET is required in production unless CHAPA_WEBHOOKS_DISABLED=true (M-Pesa-only).",
        path: ["CHAPA_WEBHOOK_SECRET"],
      });
    }
    if (
      data.NODE_ENV === "production" &&
      !data.MPESA_WEBHOOK_SECRET?.trim() &&
      !data.MPESA_WEBHOOK_IP_ALLOWLIST?.trim() &&
      !data.WEBHOOK_INSECURE_ALLOW
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "In production set MPESA_WEBHOOK_SECRET (gateway-injected header) and/or MPESA_WEBHOOK_IP_ALLOWLIST, or WEBHOOK_INSECURE_ALLOW=true for private testing only.",
        path: ["MPESA_WEBHOOK_SECRET"],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment", parsed.error.flatten().fieldErrors);
    console.error(parsed.error.issues);
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  return parsed.data;
}
