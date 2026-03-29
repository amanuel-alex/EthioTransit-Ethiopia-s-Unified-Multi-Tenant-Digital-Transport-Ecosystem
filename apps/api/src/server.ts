import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

loadEnv();

const app = createApp();
const env = loadEnv();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "ethiotransit-api listening");
});
