import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Telegraf } from "telegraf";
import { createApi } from "./services/ethiotransit-api.js";
import { sessionMiddleware } from "./utils/memory-session.js";
import { registerAllCommands } from "./commands/register.js";
import type { EthioContext } from "./handlers/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, "..");
loadEnv({ path: path.join(packageRoot, ".env") });

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const apiBase = process.env.API_BASE_URL?.trim();

if (!token) {
  console.error(
    [
      "Missing TELEGRAM_BOT_TOKEN.",
      "",
      `Create ${path.join(packageRoot, ".env")} (copy .env.example) and set:`,
      "  TELEGRAM_BOT_TOKEN=<from @BotFather>",
      "  API_BASE_URL=http://localhost:4000",
      "",
      "Or export TELEGRAM_BOT_TOKEN in your shell before pnpm start.",
    ].join("\n"),
  );
  process.exit(1);
}
if (!apiBase) {
  console.error(
    [
      "Missing API_BASE_URL (e.g. http://localhost:4000).",
      `Add it to ${path.join(packageRoot, ".env")} or export it in your shell.`,
    ].join("\n"),
  );
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
