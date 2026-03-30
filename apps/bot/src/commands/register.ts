import type { Telegraf } from "telegraf";
import type { EthioContext } from "../handlers/index.js";
import { registerHandlers } from "../handlers/index.js";

/** Wires /start, /login, /bookings, menus, and callback flows onto the bot instance. */
export function registerAllCommands(bot: Telegraf<EthioContext>) {
  registerHandlers(bot);
}
