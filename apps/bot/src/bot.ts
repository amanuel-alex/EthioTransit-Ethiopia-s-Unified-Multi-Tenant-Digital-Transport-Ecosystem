import "dotenv/config";
import { Telegraf } from "telegraf";
import { createApi } from "./services/ethiotransit-api.js";
import { sessionMiddleware } from "./utils/memory-session.js";
import { registerAllCommands } from "./commands/register.js";
import type { EthioContext } from "./handlers/index.js";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const apiBase = process.env.API_BASE_URL?.trim();

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}
if (!apiBase) {
  console.error("Missing API_BASE_URL (e.g. http://localhost:4000)");
  process.exit(1);
}

const bot = new Telegraf<EthioContext>(token);

bot.use(sessionMiddleware());
bot.use((ctx, next) => {
  const c = ctx as EthioContext;
  c.ethioApi = createApi(apiBase, () => c.ethioSession);
  return next();
});

registerAllCommands(bot);

bot.launch().then(() => {
  console.log("[ethiotransit-bot] Telegraf long polling — EthioTransit Transport Booking Bot");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
