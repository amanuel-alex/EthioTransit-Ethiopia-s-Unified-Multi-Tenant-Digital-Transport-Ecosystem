import { z } from "zod";

const envSchema = z.object({
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
  /** Optional HMAC verification for Chapa webhooks (raw body). */
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  return cached;
}
