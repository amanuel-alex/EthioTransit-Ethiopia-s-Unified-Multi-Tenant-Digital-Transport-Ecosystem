/** In-memory session per Telegram user (lost on bot restart). */
export type SearchStep =
  | "idle"
  | "pick_origin_city"
  | "pick_dest_city"
  | "pick_travel_date"
  | "pick_route"
  | "pick_schedule"
  | "pick_seats"
  | "await_mpesa_phone"
  | "await_chapa_email";

export type PopularRouteItem = {
  origin: string;
  destination: string;
  bookingCount: number;
};

export type CityItem = { id: string; name: string; slug: string };

export type RouteSearchHit = {
  id: string;
  origin: string;
  destination: string;
  company: { id: string; name: string; slug: string };
};

export type ScheduleHit = {
  schedule: {
    id: string;
    departsAt: string;
    arrivesAt: string;
    basePrice: string;
    route: { origin: string; destination: string };
    bus: { plateNumber: string; seatCapacity: number };
  };
  availableSeats: number[];
};

export interface BotSession {
  step: SearchStep;
  accessToken: string | null;
  refreshToken: string | null;
  userPhone: string | null;
  /** Pending login: phone collected, waiting code */
  loginPhone: string | null;

  originCity: CityItem | null;
  destCity: CityItem | null;
  travelDate: string | null; // YYYY-MM-DD local Ethiopia-style (calendar day)

  popularRoutes: PopularRouteItem[];
  cities: CityItem[];
  routes: RouteSearchHit[];
  schedules: ScheduleHit[];

  selectedRouteId: string | null;
  selectedScheduleId: string | null;
  selectedSeats: number[];
  lastBookingId: string | null;
}

export function emptySession(): BotSession {
  return {
    step: "idle",
    accessToken: null,
    refreshToken: null,
    userPhone: null,
    loginPhone: null,
    originCity: null,
    destCity: null,
    travelDate: null,
    popularRoutes: [],
    cities: [],
    routes: [],
    schedules: [],
    selectedRouteId: null,
    selectedScheduleId: null,
    selectedSeats: [],
    lastBookingId: null,
  };
}
