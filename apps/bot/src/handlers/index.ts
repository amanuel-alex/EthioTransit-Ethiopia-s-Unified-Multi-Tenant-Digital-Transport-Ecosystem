import { Telegraf, type Context } from "telegraf";
import type { BotSession } from "../types/session.js";
import type { EthioTransitApi } from "../services/ethiotransit-api.js";
import { EthioTransitApi as Api } from "../services/ethiotransit-api.js";
import { clearSessionPartial } from "../utils/memory-session.js";
import {
  citiesKeyboard,
  mainMenuKeyboard,
  paymentKeyboard,
  popularRoutesKeyboard,
  routesKeyboard,
  schedulesKeyboard,
  seatKeyboard,
  travelDateKeyboard,
} from "../utils/keyboards.js";
import { dayBoundsUtc, formatEtLabel, todayUtcYmd } from "../utils/dates.js";

export type EthioContext = Context & {
  ethioSession: BotSession;
  ethioApi: EthioTransitApi;
};

function s(ctx: EthioContext): BotSession {
  return ctx.ethioSession;
}

function api(ctx: EthioContext): EthioTransitApi {
  return ctx.ethioApi;
}

function requireLogin(ctx: EthioContext): boolean {
  if (!s(ctx).accessToken) {
    void ctx.reply(
      [
        "You need an EthioTransit passenger account first.",
        "",
        "Use:",
        "`/login +251900000000 123456`",
        "(phone + space + OTP — in dev this matches API `AUTH_DEV_CODE`)",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return false;
  }
  return true;
}

function travelYmd(offset: number): string {
  const base = todayUtcYmd();
  const [y, m, d] = base.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

async function sendTicketSummary(
  ctx: EthioContext,
  bookingId: string,
) {
  try {
    const list = await api(ctx).listMyBookings();
    const row = (list as Record<string, unknown>[]).find(
      (b) => b.id === bookingId,
    );
    if (!row) {
      await ctx.reply("Booking saved. Open the app or web for full details.");
      return;
    }
    const status = String(row.status ?? "");
    const sch = row.schedule as Record<string, unknown> | undefined;
    const route = sch?.route as Record<string, unknown> | undefined;
    const seats = (row.seats as { seatNo: number }[] | undefined)?.map(
      (x) => x.seatNo,
    );
    const origin = String(route?.origin ?? "—");
    const dest = String(route?.destination ?? "—");
    const dep = sch?.departsAt ? formatEtLabel(String(sch.departsAt)) : "—";
    const amt = String(row.totalAmount ?? "—");
    await ctx.reply(
      [
        "🎫 *Ticket / booking*",
        "",
        `*Status:* ${status}`,
        `*Route:* ${origin} → ${dest}`,
        `*Departure:* ${dep}`,
        `*Seats:* ${seats?.join(", ") ?? "—"}`,
        `*Total:* ${amt} ETB`,
        `*Booking ID:* \`${bookingId}\``,
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  } catch (e) {
    await ctx.reply(`Could not load ticket: ${Api.formatError(e)}`);
  }
}

async function runBookingsList(ctx: EthioContext) {
  const msg = await ctx.reply("⏳ Loading bookings…");
  try {
    const data = await api(ctx).listMyBookings();
    if (!data.length) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "No bookings yet.",
      );
      return;
    }
    const lines = (data as Record<string, unknown>[]).slice(0, 15).map((b, i) => {
      const sch = b.schedule as Record<string, unknown> | undefined;
      const route = sch?.route as Record<string, unknown> | undefined;
      const seatStr = (b.seats as { seatNo: number }[] | undefined)
        ?.map((x) => x.seatNo)
        .join(",");
      return `${i + 1}. ${String(b.status)} · ${String(route?.origin)}→${String(route?.destination)} · seats ${seatStr} · \`${String(b.id).slice(0, 10)}…\``;
    });
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      ["*My bookings*", "", ...lines].join("\n"),
      { parse_mode: "Markdown" },
    );
  } catch (e) {
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      Api.formatError(e),
    );
  }
}

export function registerHandlers(bot: Telegraf<EthioContext>) {
  bot.start(async (ctx) => {
    await ctx.reply(
      [
        "Welcome to EthioTransit 🚍",
        "",
        "Book intercity buses with the same account as the web & mobile apps.",
        "Choose an action below or use `/login` then search.",
      ].join("\n"),
      mainMenuKeyboard(),
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "*Commands*",
        "/start — menu",
        "/login `<phone> <code>` — link session",
        "/bookings — list your trips",
        "/cancel — abort current search",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

  bot.command("cancel", async (ctx) => {
    clearSessionPartial(s(ctx));
    await ctx.reply("Cancelled. Use the menu to start again.", mainMenuKeyboard());
  });

  bot.command("login", async (ctx) => {
    const text = ctx.message.text.replace(/^\/login\s*/i, "").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      await ctx.reply(
        "Usage: `/login +2519xxxxxxxx 123456`",
        { parse_mode: "Markdown" },
      );
      return;
    }
    const phone = parts[0]!;
    const code = parts[1]!;
    const msg = await ctx.reply("⏳ Signing you in…");
    try {
      const out = await api(ctx).login(phone, code);
      if (out.user.role !== "PASSENGER") {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          "This bot is for *passenger* accounts. Use a passenger phone.",
          { parse_mode: "Markdown" },
        );
        return;
      }
      const sess = s(ctx);
      sess.accessToken = out.accessToken;
      sess.refreshToken = out.refreshToken;
      sess.userPhone = phone;
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        `✅ Linked as ${phone}. You can search and book.`,
      );
      await ctx.reply("Main menu:", mainMenuKeyboard());
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        `Login failed: ${Api.formatError(e)}`,
      );
    }
  });

  bot.command("bookings", async (ctx) => {
    if (!requireLogin(ctx)) return;
    await runBookingsList(ctx);
  });

  bot.action("m:h", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("Main menu:", mainMenuKeyboard());
  });

  bot.action("m:l", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "Send `/login +2519xxxxxxxx 123456` with your passenger phone and OTP.",
      { parse_mode: "Markdown" },
    );
  });

  bot.action("m:s", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const sess = s(ctx);
    clearSessionPartial(sess);
    sess.step = "pick_origin_city";
    const msg = await ctx.reply("⏳ Loading popular routes…");
    try {
      sess.popularRoutes = await api(ctx).popularRoutes(8);
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "Pick a *popular route* or choose cities manually:",
        {
          parse_mode: "Markdown",
          ...popularRoutesKeyboard(sess.popularRoutes),
        },
      );
    } catch {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "⏳ Loading cities…",
      );
      try {
        sess.cities = await api(ctx).listCities();
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          "Select *origin* city:",
          {
            parse_mode: "Markdown",
            ...citiesKeyboard(sess.cities, "o", 0),
          },
        );
      } catch (e2) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          Api.formatError(e2),
        );
      }
    }
  });

  bot.action("m:b", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    await runBookingsList(ctx);
  });

  bot.action(/^pr:x$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const sess = s(ctx);
    const msg = await ctx.reply("⏳ Loading cities…");
    try {
      sess.cities = await api(ctx).listCities();
      sess.step = "pick_origin_city";
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "Select *origin* city:",
        { parse_mode: "Markdown", ...citiesKeyboard(sess.cities, "o", 0) },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        Api.formatError(e),
      );
    }
  });

  bot.action(/^pr:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const idx = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    const pr = sess.popularRoutes[idx];
    if (!pr) {
      await ctx.reply("This route is no longer available. Try /start → Search.");
      return;
    }
    sess.originCity = { id: "", name: pr.origin, slug: "" };
    sess.destCity = { id: "", name: pr.destination, slug: "" };
    sess.step = "pick_travel_date";
    await ctx.reply(
      `Route: *${pr.origin}* → *${pr.destination}*\nPick travel day:`,
      { parse_mode: "Markdown", ...travelDateKeyboard(todayUtcYmd()) },
    );
  });

  bot.action(/^op:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    await ctx.editMessageReplyMarkup(citiesKeyboard(sess.cities, "o", page).reply_markup);
  });

  bot.action(/^dp:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    await ctx.editMessageReplyMarkup(citiesKeyboard(sess.cities, "d", page).reply_markup);
  });

  bot.action(/^o:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const id = ctx.match[1]!;
    const sess = s(ctx);
    const city = sess.cities.find((c) => c.id === id);
    if (!city) {
      await ctx.reply("City not found. Start search again.");
      return;
    }
    sess.originCity = city;
    sess.step = "pick_dest_city";
    await ctx.editMessageText(
      `Origin: *${city.name}*\nSelect *destination*:`,
      { parse_mode: "Markdown", ...citiesKeyboard(sess.cities, "d", 0) },
    );
  });

  bot.action(/^d:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const id = ctx.match[1]!;
    const sess = s(ctx);
    const city = sess.cities.find((c) => c.id === id);
    if (!city) {
      await ctx.reply("City not found.");
      return;
    }
    if (sess.originCity && city.id === sess.originCity.id) {
      await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, "Pick a different city", {
        show_alert: true,
      });
      return;
    }
    sess.destCity = city;
    sess.step = "pick_travel_date";
    await ctx.editMessageText(
      `*${sess.originCity?.name}* → *${city.name}*\nPick travel day:`,
      { parse_mode: "Markdown", ...travelDateKeyboard(todayUtcYmd()) },
    );
  });

  bot.action(/^dt:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const off = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    if (!sess.originCity || !sess.destCity) {
      await ctx.reply("Start search again from the menu.");
      return;
    }
    sess.travelDate = travelYmd(off);
    const msg = await ctx.reply(
      `⏳ Searching routes for *${sess.originCity.name}* → *${sess.destCity.name}* on \`${sess.travelDate}\`…`,
      { parse_mode: "Markdown" },
    );
    try {
      sess.routes = await api(ctx).searchRoutes(
        sess.originCity.name,
        sess.destCity.name,
      );
      sess.step = "pick_route";
      if (!sess.routes.length) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          "No routes found for this pair. Try other cities or dates.",
        );
        return;
      }
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "Select an operator / route:",
        routesKeyboard(sess.routes),
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        Api.formatError(e),
      );
    }
  });

  bot.action(/^rt:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const routeId = ctx.match[1]!;
    const sess = s(ctx);
    if (!sess.travelDate) {
      await ctx.reply("Session expired. Search again.");
      return;
    }
    sess.selectedRouteId = routeId;
    const msg = await ctx.reply("⏳ Loading departures…");
    try {
      const { from, to } = dayBoundsUtc(sess.travelDate);
      sess.schedules = await api(ctx).schedulesForRoute(routeId, from, to);
      sess.step = "pick_schedule";
      if (!sess.schedules.length) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          "No buses that day. Pick another route or date.",
        );
        return;
      }
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        "Select a departure:",
        schedulesKeyboard(sess.schedules),
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        Api.formatError(e),
      );
    }
  });

  bot.action(/^sc:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const scheduleId = ctx.match[1]!;
    const sess = s(ctx);
    const msg = await ctx.reply("⏳ Loading seats…");
    try {
      const detail = await api(ctx).scheduleById(scheduleId);
      sess.selectedScheduleId = scheduleId;
      sess.selectedSeats = [];
      sess.step = "pick_seats";
      const avail = detail.availableSeats;
      if (!avail.length) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          "No seats available on this bus.",
        );
        return;
      }
      const selected = new Set(sess.selectedSeats);
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        [
          `Bus *${detail.schedule.bus.plateNumber}* · ${formatEtLabel(detail.schedule.departsAt)}`,
          `Price *${detail.schedule.basePrice} ETB* / seat`,
          "",
          `Selected: *${sess.selectedSeats.join(", ") || "none"}*`,
          "",
          "Tap seats to toggle, then *Book these seats*.",
        ].join("\n"),
        {
          parse_mode: "Markdown",
          ...seatKeyboard(avail, selected, 0),
        },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        Api.formatError(e),
      );
    }
  });

  bot.action(/^st:(\d+)$/, async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    const seat = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    if (!sess.selectedScheduleId || sess.step !== "pick_seats") {
      await ctx.answerCbQuery();
      return;
    }
    try {
      const detail = await api(ctx).scheduleById(sess.selectedScheduleId);
      const avail = new Set(detail.availableSeats);
      if (!avail.has(seat)) {
        await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, "Seat not available", {
          show_alert: true,
        });
        return;
      }
      const set = new Set(sess.selectedSeats);
      if (set.has(seat)) set.delete(seat);
      else set.add(seat);
      sess.selectedSeats = [...set].sort((a, b) => a - b);
      const selected = new Set(sess.selectedSeats);
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        [
          `Bus *${detail.schedule.bus.plateNumber}* · ${formatEtLabel(detail.schedule.departsAt)}`,
          `Price *${detail.schedule.basePrice} ETB* / seat`,
          "",
          `Selected: *${sess.selectedSeats.join(", ") || "none"}*`,
          "",
          "Tap seats to toggle, then *Book these seats*.",
        ].join("\n"),
        {
          parse_mode: "Markdown",
          ...seatKeyboard(detail.availableSeats, selected, 0),
        },
      );
    } catch (e) {
      await ctx.answerCbQuery();
      await ctx.reply(Api.formatError(e));
    }
  });

  bot.action(/^stp:(\d+)$/, async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    if (!sess.selectedScheduleId) return;
    try {
      const detail = await api(ctx).scheduleById(sess.selectedScheduleId);
      const selected = new Set(sess.selectedSeats);
      await ctx.editMessageText(
        [
          `Bus *${detail.schedule.bus.plateNumber}* · ${formatEtLabel(detail.schedule.departsAt)}`,
          `Price *${detail.schedule.basePrice} ETB* / seat`,
          "",
          `Selected: *${sess.selectedSeats.join(", ") || "none"}*`,
          "",
          "Tap seats to toggle, then *Book these seats*.",
        ].join("\n"),
        {
          parse_mode: "Markdown",
          ...seatKeyboard(detail.availableSeats, selected, page),
        },
      );
    } catch {
      /* ignore */
    }
  });

  bot.action("cf:ca", async (ctx) => {
    await ctx.answerCbQuery();
    clearSessionPartial(s(ctx));
    await ctx.reply("Cancelled.", mainMenuKeyboard());
  });

  bot.action("cf:book", async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    const sess = s(ctx);
    if (!sess.selectedScheduleId || !sess.selectedSeats.length) {
      await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, "Select at least one seat", {
        show_alert: true,
      });
      return;
    }
    await ctx.answerCbQuery();
    const msg = await ctx.reply("⏳ Creating booking…");
    try {
      const booking = await api(ctx).createBooking(
        sess.selectedScheduleId,
        sess.selectedSeats,
      );
      sess.lastBookingId = booking.id;
      sess.step = "idle";
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        [
          "✅ *Booking created* (pending payment)",
          "",
          `ID: \`${booking.id}\``,
          `Seats: ${booking.seats.join(", ")}`,
          `Total: *${booking.totalAmount} ETB*`,
          "",
          "Choose payment:",
        ].join("\n"),
        { parse_mode: "Markdown", ...paymentKeyboard() },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        Api.formatError(e),
      );
    }
  });

  bot.action("py:x", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply("No recent booking in session.");
      return;
    }
    await sendTicketSummary(ctx, sess.lastBookingId);
  });

  bot.action("py:m", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply("No booking to pay.");
      return;
    }
    sess.step = "await_mpesa_phone";
    await ctx.reply(
      [
        "M-Pesa STK push",
        "",
        "Send your M-Pesa phone (e.g. `2547…` or `07…`).",
        `Reply *same* to use your linked EthioTransit phone \`${sess.userPhone ?? "?"}\`.`,
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

  bot.action("py:c", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply("No booking to pay.");
      return;
    }
    sess.step = "await_chapa_email";
    await ctx.reply("Send your email for the Chapa checkout link.");
  });

  bot.on("text", async (ctx, next) => {
    const sess = s(ctx);
    if (sess.step === "await_mpesa_phone") {
      let phone = ctx.message.text.trim();
      if (/^same$/i.test(phone)) {
        phone = sess.userPhone ?? "";
      }
      if (phone.length < 5) {
        await ctx.reply("Invalid phone. Try again.");
        return;
      }
      const msg = await ctx.reply("⏳ Starting M-Pesa…");
      try {
        const out = await api(ctx).initiateMpesa(sess.lastBookingId!, phone);
        sess.step = "idle";
        if (out.mock) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            "✅ Payment completed (dev/mock). Your ticket:",
          );
          if (sess.lastBookingId) {
            await sendTicketSummary(ctx, sess.lastBookingId);
          }
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            [
              "📱 Check your phone for the M-Pesa prompt.",
              `Checkout ref: \`${out.checkoutRequestId ?? out.paymentId}\``,
              "",
              "When paid, use *My bookings* or `/bookings` to see status.",
            ].join("\n"),
            { parse_mode: "Markdown" },
          );
        }
      } catch (e) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          Api.formatError(e),
        );
      }
      return;
    }

    if (sess.step === "await_chapa_email") {
      const email = ctx.message.text.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await ctx.reply("That doesn’t look like an email. Try again.");
        return;
      }
      const msg = await ctx.reply("⏳ Starting Chapa…");
      try {
        const out = await api(ctx).initiateChapa(sess.lastBookingId!, email);
        sess.step = "idle";
        if (out.mock) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            "✅ Payment completed (dev/mock). Your ticket:",
          );
          if (sess.lastBookingId) {
            await sendTicketSummary(ctx, sess.lastBookingId);
          }
        } else if (out.checkoutUrl) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            `Pay here: ${out.checkoutUrl}\nTx: \`${out.txRef}\``,
            { parse_mode: "Markdown" },
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            "Chapa initiated — check your email or SMS for next steps.",
          );
        }
      } catch (e) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          Api.formatError(e),
        );
      }
      return;
    }

    return next();
  });

  bot.catch((err, ctx) => {
    console.error("bot error", err);
    void ctx?.reply("Something went wrong. Try /start or /cancel.");
  });
}
