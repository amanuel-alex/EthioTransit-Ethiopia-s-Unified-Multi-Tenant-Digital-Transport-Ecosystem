import { Telegraf, type Context } from "telegraf";
import type { BotLocale, BotSession } from "../types/session.js";
import type { EthioTransitApi } from "../services/ethiotransit-api.js";
import { EthioTransitApi as Api } from "../services/ethiotransit-api.js";
import { clearSessionPartial } from "../utils/memory-session.js";
import { escapeHtml } from "../utils/escape-html.js";
import { localeLabel, tr } from "../i18n/index.js";
import { welcomeMessage } from "../i18n/welcome.js";
import {
  citiesKeyboard,
  languagePickerKeyboard,
  paymentKeyboard,
  popularRoutesKeyboard,
  routesKeyboard,
  schedulesKeyboard,
  seatKeyboard,
  startScreenKeyboard,
  travelDateKeyboard,
} from "../utils/keyboards.js";
import { dayBoundsUtc, formatEtLabel, todayUtcYmd } from "../utils/dates.js";

const HTML = { parse_mode: "HTML" as const };

export type EthioContext = Context & {
  ethioSession: BotSession;
  ethioApi: EthioTransitApi;
};

function s(ctx: EthioContext): BotSession {
  return ctx.ethioSession;
}

function loc(ctx: EthioContext): BotLocale {
  return s(ctx).locale;
}

function api(ctx: EthioContext): EthioTransitApi {
  return ctx.ethioApi;
}

function requireLogin(ctx: EthioContext): boolean {
  const L = loc(ctx);
  if (!s(ctx).accessToken) {
    void ctx.reply(
      [
        `⚠️ <b>${tr(L, "needLoginTitle")}</b>`,
        "",
        tr(L, "needLoginBody"),
      ].join("\n"),
      HTML,
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

async function sendTicketSummary(ctx: EthioContext, bookingId: string) {
  const L = loc(ctx);
  try {
    const list = await api(ctx).listMyBookings();
    const row = (list as Record<string, unknown>[]).find(
      (b) => b.id === bookingId,
    );
    if (!row) {
      await ctx.reply(tr(L, "ticketSaved"), HTML);
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
        tr(L, "ticketTitle"),
        "",
        `<b>${tr(L, "ticketStatus")}:</b> ${escapeHtml(status)}`,
        `<b>${tr(L, "ticketRoute")}:</b> ${escapeHtml(origin)} → ${escapeHtml(dest)}`,
        `<b>${tr(L, "ticketDeparture")}:</b> ${escapeHtml(dep)}`,
        `<b>${tr(L, "ticketSeats")}:</b> ${escapeHtml(seats?.join(", ") ?? "—")}`,
        `<b>${tr(L, "ticketTotal")}:</b> ${escapeHtml(amt)} ETB`,
        `<b>${tr(L, "ticketId")}:</b> <code>${escapeHtml(bookingId)}</code>`,
      ].join("\n"),
      HTML,
    );
  } catch (e) {
    await ctx.reply(
      tr(L, "ticketLoadError", { error: escapeHtml(Api.formatError(e)) }),
      HTML,
    );
  }
}

async function runBookingsList(ctx: EthioContext) {
  const L = loc(ctx);
  const msg = await ctx.reply(tr(L, "loadingBookings"), HTML);
  try {
    const data = await api(ctx).listMyBookings();
    if (!data.length) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "noBookings"),
        HTML,
      );
      return;
    }
    const lines = (data as Record<string, unknown>[]).slice(0, 15).map((b, i) => {
      const sch = b.schedule as Record<string, unknown> | undefined;
      const route = sch?.route as Record<string, unknown> | undefined;
      const seatStr = (b.seats as { seatNo: number }[] | undefined)
        ?.map((x) => x.seatNo)
        .join(",");
      const st = escapeHtml(String(b.status));
      const o = escapeHtml(String(route?.origin));
      const d = escapeHtml(String(route?.destination));
      const id = escapeHtml(String(b.id).slice(0, 10));
      return `${i + 1}. ${st} · ${o}→${d} · ${seatStr} · <code>${id}…</code>`;
    });
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      [tr(L, "myBookingsHeader"), "", ...lines].join("\n"),
      HTML,
    );
  } catch (e) {
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      escapeHtml(Api.formatError(e)),
    );
  }
}

function seatBlock(
  L: BotLocale,
  plate: string,
  time: string,
  price: string,
  seats: number[],
): string {
  const seatStr = seats.length ? seats.join(", ") : tr(L, "seatNone");
  return [
    tr(L, "seatHeader", { plate: escapeHtml(plate), time: escapeHtml(time) }),
    tr(L, "seatPrice", { price: escapeHtml(price) }),
    "",
    tr(L, "seatSelected", { seats: escapeHtml(seatStr) }),
    "",
    tr(L, "seatHint"),
  ].join("\n");
}

function replyHtmlWithKeyboard(
  ctx: EthioContext,
  text: string,
  kb: ReturnType<typeof startScreenKeyboard>,
) {
  return ctx.reply(text, { parse_mode: "HTML", reply_markup: kb.reply_markup });
}

export function registerHandlers(bot: Telegraf<EthioContext>) {
  bot.start(async (ctx) => {
    const L = loc(ctx);
    await replyHtmlWithKeyboard(ctx, welcomeMessage(L), startScreenKeyboard(L));
  });

  bot.action(/^lang:(en|am|om)$/, async (ctx) => {
    const code = ctx.match[1] as BotLocale;
    await ctx.answerCbQuery(localeLabel(code));
    s(ctx).locale = code;
    const homeKb = startScreenKeyboard(code);
    try {
      await ctx.editMessageText(welcomeMessage(code), {
        parse_mode: "HTML",
        reply_markup: homeKb.reply_markup,
      });
    } catch {
      await replyHtmlWithKeyboard(ctx, welcomeMessage(code), homeKb);
    }
  });

  bot.command("help", async (ctx) => {
    const L = loc(ctx);
    await ctx.reply(
      [
        tr(L, "helpTitle"),
        "",
        tr(L, "helpStart"),
        tr(L, "helpLogin"),
        tr(L, "helpBookings"),
        tr(L, "helpCancel"),
      ].join("\n"),
      HTML,
    );
  });

  bot.command("cancel", async (ctx) => {
    const L = loc(ctx);
    clearSessionPartial(s(ctx));
    await replyHtmlWithKeyboard(ctx, tr(L, "cancelDone"), startScreenKeyboard(L));
  });

  bot.command("login", async (ctx) => {
    const L = loc(ctx);
    const text = ctx.message.text.replace(/^\/login\s*/i, "").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      await ctx.reply(tr(L, "loginUsage"), HTML);
      return;
    }
    const phone = parts[0]!;
    const code = parts[1]!;
    const msg = await ctx.reply(tr(L, "loginSigning"), HTML);
    try {
      const out = await api(ctx).login(phone, code);
      if (out.user.role !== "PASSENGER") {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          tr(L, "loginPassengerOnly"),
          HTML,
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
        tr(L, "loginOk", { phone: escapeHtml(phone) }),
        HTML,
      );
      await replyHtmlWithKeyboard(ctx, tr(L, "mainMenuLabel"), startScreenKeyboard(L));
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "loginFailed", { error: escapeHtml(Api.formatError(e)) }),
        HTML,
      );
    }
  });

  bot.command("bookings", async (ctx) => {
    if (!requireLogin(ctx)) return;
    await runBookingsList(ctx);
  });

  bot.action("m:h", async (ctx) => {
    await ctx.answerCbQuery();
    const L = loc(ctx);
    await replyHtmlWithKeyboard(ctx, welcomeMessage(L), startScreenKeyboard(L));
  });

  bot.action("m:g", async (ctx) => {
    await ctx.answerCbQuery();
    const L = loc(ctx);
    const langKb = languagePickerKeyboard();
    await ctx.reply([tr(L, "chooseLanguageTitle"), "", tr(L, "chooseLanguageHint")].join("\n"), {
      parse_mode: "HTML",
      reply_markup: langKb.reply_markup,
    });
  });

  bot.action("m:l", async (ctx) => {
    await ctx.answerCbQuery();
    const L = loc(ctx);
    await ctx.reply(tr(L, "loginPromptCb"), HTML);
  });

  bot.action("m:s", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const sess = s(ctx);
    clearSessionPartial(sess);
    sess.step = "pick_origin_city";
    const msg = await ctx.reply(tr(L, "loadingPopular"), HTML);
    try {
      sess.popularRoutes = await api(ctx).popularRoutes(8);
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "pickPopular"),
        { ...HTML, ...popularRoutesKeyboard(L, sess.popularRoutes) },
      );
    } catch {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "loadingCities"),
        HTML,
      );
      try {
        sess.cities = await api(ctx).listCities();
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          tr(L, "selectOrigin"),
          { ...HTML, ...citiesKeyboard(L, sess.cities, "o", 0) },
        );
      } catch (e2) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          escapeHtml(Api.formatError(e2)),
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
    const L = loc(ctx);
    const sess = s(ctx);
    const msg = await ctx.reply(tr(L, "loadingCities"), HTML);
    try {
      sess.cities = await api(ctx).listCities();
      sess.step = "pick_origin_city";
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "selectOrigin"),
        { ...HTML, ...citiesKeyboard(L, sess.cities, "o", 0) },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        escapeHtml(Api.formatError(e)),
      );
    }
  });

  bot.action(/^pr:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const idx = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    const pr = sess.popularRoutes[idx];
    if (!pr) {
      await ctx.reply(tr(L, "routeUnavailable"), HTML);
      return;
    }
    sess.originCity = { id: "", name: pr.origin, slug: "" };
    sess.destCity = { id: "", name: pr.destination, slug: "" };
    sess.step = "pick_travel_date";
    await ctx.reply(
      tr(L, "routePickDay", {
        origin: escapeHtml(pr.origin),
        dest: escapeHtml(pr.destination),
      }),
      { ...HTML, ...travelDateKeyboard(L) },
    );
  });

  bot.action(/^op:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    await ctx.editMessageReplyMarkup(citiesKeyboard(L, sess.cities, "o", page).reply_markup);
  });

  bot.action(/^dp:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    await ctx.editMessageReplyMarkup(citiesKeyboard(L, sess.cities, "d", page).reply_markup);
  });

  bot.action(/^o:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const id = ctx.match[1]!;
    const sess = s(ctx);
    const city = sess.cities.find((c) => c.id === id);
    if (!city) {
      await ctx.reply(tr(L, "cityNotFound"), HTML);
      return;
    }
    sess.originCity = city;
    sess.step = "pick_dest_city";
    await ctx.editMessageText(
      tr(L, "selectDest", { origin: escapeHtml(city.name) }),
      { ...HTML, ...citiesKeyboard(L, sess.cities, "d", 0) },
    );
  });

  bot.action(/^d:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const id = ctx.match[1]!;
    const sess = s(ctx);
    const city = sess.cities.find((c) => c.id === id);
    if (!city) {
      await ctx.reply(tr(L, "cityNotFoundShort"), HTML);
      return;
    }
    if (sess.originCity && city.id === sess.originCity.id) {
      await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, tr(L, "pickDifferentCity"), {
        show_alert: true,
      });
      return;
    }
    sess.destCity = city;
    sess.step = "pick_travel_date";
    await ctx.editMessageText(
      tr(L, "arrowRoute", {
        origin: escapeHtml(sess.originCity?.name ?? ""),
        dest: escapeHtml(city.name),
      }),
      { ...HTML, ...travelDateKeyboard(L) },
    );
  });

  bot.action(/^dt:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const off = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    if (!sess.originCity || !sess.destCity) {
      await ctx.reply(tr(L, "startSearchAgain"), HTML);
      return;
    }
    sess.travelDate = travelYmd(off);
    const msg = await ctx.reply(
      tr(L, "searchingRoutes", {
        origin: escapeHtml(sess.originCity.name),
        dest: escapeHtml(sess.destCity.name),
        date: escapeHtml(sess.travelDate),
      }),
      HTML,
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
          tr(L, "noRoutes"),
          HTML,
        );
        return;
      }
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "selectRoute"),
        { ...HTML, ...routesKeyboard(sess.routes) },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        escapeHtml(Api.formatError(e)),
      );
    }
  });

  bot.action(/^rt:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const routeId = ctx.match[1]!;
    const sess = s(ctx);
    if (!sess.travelDate) {
      await ctx.reply(tr(L, "sessionExpired"), HTML);
      return;
    }
    sess.selectedRouteId = routeId;
    const msg = await ctx.reply(tr(L, "loadingDepartures"), HTML);
    try {
      const { from, to } = dayBoundsUtc(sess.travelDate);
      sess.schedules = await api(ctx).schedulesForRoute(routeId, from, to);
      sess.step = "pick_schedule";
      if (!sess.schedules.length) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          tr(L, "noDepartures"),
          HTML,
        );
        return;
      }
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        tr(L, "selectDeparture"),
        { ...HTML, ...schedulesKeyboard(L, sess.schedules) },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        escapeHtml(Api.formatError(e)),
      );
    }
  });

  bot.action(/^sc:([^:]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const scheduleId = ctx.match[1]!;
    const sess = s(ctx);
    const msg = await ctx.reply(tr(L, "loadingSeats"), HTML);
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
          tr(L, "noSeats"),
          HTML,
        );
        return;
      }
      const selected = new Set(sess.selectedSeats);
      const sch = detail.schedule;
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        seatBlock(
          L,
          sch.bus.plateNumber,
          formatEtLabel(sch.departsAt),
          String(sch.basePrice),
          sess.selectedSeats,
        ),
        {
          ...HTML,
          ...seatKeyboard(L, avail, selected, 0),
        },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        escapeHtml(Api.formatError(e)),
      );
    }
  });

  bot.action(/^st:(\d+)$/, async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    const L = loc(ctx);
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
        await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, tr(L, "seatNotAvail"), {
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
      const sch = detail.schedule;
      await ctx.editMessageText(
        seatBlock(
          L,
          sch.bus.plateNumber,
          formatEtLabel(sch.departsAt),
          String(sch.basePrice),
          sess.selectedSeats,
        ),
        {
          ...HTML,
          ...seatKeyboard(L, detail.availableSeats, selected, 0),
        },
      );
    } catch (e) {
      await ctx.answerCbQuery();
      await ctx.reply(escapeHtml(Api.formatError(e)));
    }
  });

  bot.action(/^stp:(\d+)$/, async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    await ctx.answerCbQuery();
    const L = loc(ctx);
    const page = parseInt(ctx.match[1]!, 10);
    const sess = s(ctx);
    if (!sess.selectedScheduleId) return;
    try {
      const detail = await api(ctx).scheduleById(sess.selectedScheduleId);
      const selected = new Set(sess.selectedSeats);
      const sch = detail.schedule;
      await ctx.editMessageText(
        seatBlock(
          L,
          sch.bus.plateNumber,
          formatEtLabel(sch.departsAt),
          String(sch.basePrice),
          sess.selectedSeats,
        ),
        {
          ...HTML,
          ...seatKeyboard(L, detail.availableSeats, selected, page),
        },
      );
    } catch {
      /* ignore */
    }
  });

  bot.action("cf:ca", async (ctx) => {
    await ctx.answerCbQuery();
    const L = loc(ctx);
    clearSessionPartial(s(ctx));
    await replyHtmlWithKeyboard(ctx, tr(L, "cancelledShort"), startScreenKeyboard(L));
  });

  bot.action("cf:book", async (ctx) => {
    if (!requireLogin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }
    const L = loc(ctx);
    const sess = s(ctx);
    if (!sess.selectedScheduleId || !sess.selectedSeats.length) {
      await ctx.telegram.answerCbQuery(ctx.callbackQuery!.id, tr(L, "selectOneSeat"), {
        show_alert: true,
      });
      return;
    }
    await ctx.answerCbQuery();
    const msg = await ctx.reply(tr(L, "creatingBooking"), HTML);
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
          tr(L, "bookingCreated"),
          "",
          `<b>${tr(L, "bookingId")}:</b> <code>${escapeHtml(booking.id)}</code>`,
          `<b>${tr(L, "bookingSeats")}:</b> ${escapeHtml(booking.seats.join(", "))}`,
          `<b>${tr(L, "bookingTotal")}:</b> ${escapeHtml(String(booking.totalAmount))} ETB`,
          "",
          tr(L, "choosePayment"),
        ].join("\n"),
        { ...HTML, ...paymentKeyboard(L) },
      );
    } catch (e) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        msg.message_id,
        undefined,
        escapeHtml(Api.formatError(e)),
      );
    }
  });

  bot.action("py:x", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply(tr(L, "noBookingSession"), HTML);
      return;
    }
    await sendTicketSummary(ctx, sess.lastBookingId);
  });

  bot.action("py:m", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply(tr(L, "noBookingPay"), HTML);
      return;
    }
    sess.step = "await_mpesa_phone";
    const phoneEsc = escapeHtml(sess.userPhone ?? "?");
    await ctx.reply(
      [tr(L, "mpesaTitle"), "", tr(L, "mpesaPhone"), "", tr(L, "mpesaSame", { phone: phoneEsc })].join(
        "\n",
      ),
      HTML,
    );
  });

  bot.action("py:c", async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireLogin(ctx)) return;
    const L = loc(ctx);
    const sess = s(ctx);
    if (!sess.lastBookingId) {
      await ctx.reply(tr(L, "noBookingPay"), HTML);
      return;
    }
    sess.step = "await_chapa_email";
    await ctx.reply(tr(L, "chapaEmail"), HTML);
  });

  bot.on("text", async (ctx, next) => {
    const sess = s(ctx);
    const L = loc(ctx);
    if (sess.step === "await_mpesa_phone") {
      let phone = ctx.message.text.trim();
      if (/^same$/i.test(phone)) {
        phone = sess.userPhone ?? "";
      }
      if (phone.length < 5) {
        await ctx.reply(tr(L, "invalidPhone"), HTML);
        return;
      }
      const msg = await ctx.reply(tr(L, "mpesaStart"), HTML);
      try {
        const out = await api(ctx).initiateMpesa(sess.lastBookingId!, phone);
        sess.step = "idle";
        if (out.mock) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            tr(L, "mpesaMock"),
            HTML,
          );
          if (sess.lastBookingId) {
            await sendTicketSummary(ctx, sess.lastBookingId);
          }
        } else {
          const ref = escapeHtml(String(out.checkoutRequestId ?? out.paymentId ?? "—"));
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            tr(L, "mpesaPrompt", { ref }),
            HTML,
          );
        }
      } catch (e) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          escapeHtml(Api.formatError(e)),
        );
      }
      return;
    }

    if (sess.step === "await_chapa_email") {
      const email = ctx.message.text.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await ctx.reply(tr(L, "invalidEmail"), HTML);
        return;
      }
      const msg = await ctx.reply(tr(L, "chapaStart"), HTML);
      try {
        const out = await api(ctx).initiateChapa(sess.lastBookingId!, email);
        sess.step = "idle";
        if (out.mock) {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            tr(L, "chapaMock"),
            HTML,
          );
          if (sess.lastBookingId) {
            await sendTicketSummary(ctx, sess.lastBookingId);
          }
        } else if (out.checkoutUrl) {
          const url = escapeHtml(out.checkoutUrl);
          const ref = escapeHtml(String(out.txRef ?? "—"));
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            tr(L, "chapaLink", { url, ref }),
            HTML,
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat!.id,
            msg.message_id,
            undefined,
            tr(L, "chapaFallback"),
            HTML,
          );
        }
      } catch (e) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          msg.message_id,
          undefined,
          escapeHtml(Api.formatError(e)),
        );
      }
      return;
    }

    return next();
  });

  bot.catch((err, ctx) => {
    console.error("[ethiotransit-bot] Handler error:", err);
    const c = ctx as EthioContext | undefined;
    const L = c?.ethioSession?.locale ?? "en";
    if (!c?.chat) {
      console.error("[ethiotransit-bot] No chat on context; cannot send error reply.");
      return;
    }
    void c.reply(tr(L, "somethingWrong"), HTML).catch((sendErr: unknown) => {
      console.error("[ethiotransit-bot] Could not send error message:", sendErr);
    });
  });
}
