import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(apiRoot, ".env");
const examplePath = join(apiRoot, ".env.example");

dotenv.config({ path: envPath });
if (process.env.NODE_ENV !== "production" && !existsSync(envPath)) {
  dotenv.config({ path: examplePath });
  console.warn(
    "[ethiotransit-api] No apps/api/.env — loaded .env.example for local dev. Copy to .env to customize.",
  );
}

loadEnv();

const app = createApp();
const env = loadEnv();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "ethiotransit-api listening");
});
