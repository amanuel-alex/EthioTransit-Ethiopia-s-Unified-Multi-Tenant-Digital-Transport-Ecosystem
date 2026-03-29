import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { loadEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  apiRateLimiter,
  authRateLimiter,
  webhookRateLimiter,
} from "./middleware/rateLimit.js";
import { handlePaymentsWebhook } from "./modules/payments/webhook.handler.js";
import { healthRouter } from "./modules/health/health.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { routesModuleRouter } from "./modules/routes/routes.router.js";
import { schedulesRouter } from "./modules/schedules/schedules.router.js";
import { bookingsRouter } from "./modules/bookings/bookings.router.js";
import { paymentsRouter } from "./modules/payments/payments.router.js";
import { companyRouter } from "./modules/company/company.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";

const API_PREFIX = "/api/v1";

export function createApp() {
  const env = loadEnv();
  const app = express();

  if (env.NODE_ENV === "production" || process.env.MPESA_WEBHOOK_IP_ALLOWLIST) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());

  const corsOrigins = env.CORS_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin:
        corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    }),
  );

  app.use((req, res, next) => {
    const reqId = randomUUID();
    const child = logger.child({ reqId });
    const start = Date.now();
    res.on("finish", () => {
      child.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    });
    next();
  });

  app.post(
    `${API_PREFIX}/payments/webhook`,
    webhookRateLimiter,
    express.raw({ type: () => true, limit: "2mb" }),
    (req, res, next) => {
      const buf = req.body as Buffer;
      req.rawBody = buf;
      try {
        req.body = JSON.parse(buf.toString("utf8")) as Record<string, unknown>;
      } catch {
        res.status(400).send("invalid json");
        return;
      }
      void handlePaymentsWebhook(req, res, next);
    },
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(API_PREFIX, apiRateLimiter);

  app.use(API_PREFIX, healthRouter);
  app.use(`${API_PREFIX}/auth`, authRateLimiter, authRouter);
  app.use(`${API_PREFIX}/routes`, routesModuleRouter);
  app.use(`${API_PREFIX}/schedules`, schedulesRouter);
  app.use(`${API_PREFIX}/bookings`, bookingsRouter);
  app.use(`${API_PREFIX}/payments`, paymentsRouter);
  app.use(`${API_PREFIX}/company`, companyRouter);
  app.use(`${API_PREFIX}/admin`, adminRouter);

  app.use(errorHandler);
  return app;
}
