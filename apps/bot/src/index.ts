import "dotenv/config";
import { Bot } from "grammy";
import { toIsoTimestamp } from "@ethiotransit/shared";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", (ctx) =>
  ctx.reply(
    "EthioTransit bot is running. Use /help for commands.",
  ),
);

bot.command("help", (ctx) =>
  ctx.reply(
    [
      "/start — welcome",
      "/help — this message",
      "/ping — API-style health check",
    ].join("\n"),
  ),
);

bot.command("ping", (ctx) =>
  ctx.reply(`pong @ ${toIsoTimestamp()}`),
);

bot.catch((err) => console.error("bot error", err));

bot.start();
console.log("[bot] grammY long polling started");
