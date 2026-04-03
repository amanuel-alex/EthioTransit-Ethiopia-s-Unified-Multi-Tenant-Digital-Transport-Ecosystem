import type { Context, MiddlewareFn } from "telegraf";
import { emptySession, type BotSession } from "../types/session.js";

const store = new Map<number, BotSession>();

export function getSessionKey(ctx: Context): number | null {
  return ctx.from?.id ?? null;
}

export function sessionMiddleware(): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const id = getSessionKey(ctx);
    if (id == null) {
      // No user id (some update types): still attach session so handlers don't crash.
      (ctx as Context & { ethioSession: BotSession }).ethioSession = emptySession();
      await next();
      return;
    }
    if (!store.has(id)) {
      store.set(id, emptySession());
    }
    const session = store.get(id)!;
    (ctx as Context & { ethioSession: BotSession }).ethioSession = session;
    await next();
    store.set(id, session);
  };
}

export function clearSessionPartial(session: BotSession) {
  session.step = "idle";
  session.originCity = null;
  session.destCity = null;
  session.travelDate = null;
  session.popularRoutes = [];
  session.cities = [];
  session.routes = [];
  session.schedules = [];
  session.selectedRouteId = null;
  session.selectedScheduleId = null;
  session.selectedSeats = [];
  session.lastBookingId = null;
}
