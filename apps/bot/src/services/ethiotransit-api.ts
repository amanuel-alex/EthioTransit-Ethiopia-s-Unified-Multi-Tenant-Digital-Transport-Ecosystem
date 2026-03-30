import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type {
  BotSession,
  CityItem,
  PopularRouteItem,
  RouteSearchHit,
  ScheduleHit,
} from "../types/session.js";

const JSON_HDR = { "Content-Type": "application/json" };

function apiMessage(err: unknown): string {
  const ax = err as AxiosError<{
    message?: string;
    error?: string;
    code?: string;
  }>;
  const d = ax.response?.data;
  return (
    d?.message ??
    d?.error ??
    ax.message ??
    (err instanceof Error ? err.message : "Request failed")
  );
}

export class EthioTransitApi {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private getSession: () => BotSession,
  ) {
    const root = baseUrl.replace(/\/$/, "");
    this.client = axios.create({
      baseURL: `${root}/api/v1`,
      timeout: 45_000,
      headers: JSON_HDR,
    });

    this.client.interceptors.request.use((config) => {
      const { accessToken } = getSession();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const original = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
        if (status === 401 && original && !original._retry) {
          original._retry = true;
          const rt = getSession().refreshToken;
          if (rt) {
            try {
              const { data } = await axios.post<{
                accessToken: string;
                refreshToken: string;
              }>(
                `${this.client.defaults.baseURL}/auth/refresh`,
                { refreshToken: rt },
                { headers: JSON_HDR },
              );
              const s = getSession();
              s.accessToken = data.accessToken;
              s.refreshToken = data.refreshToken;
              original.headers.Authorization = `Bearer ${data.accessToken}`;
              return this.client.request(original);
            } catch {
              /* fall through */
            }
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async login(phone: string, code: string) {
    const { data } = await this.client.post<{
      accessToken: string;
      refreshToken: string;
      user: { role: string };
    }>("/auth/login", { phone, code });
    return data;
  }

  async popularRoutes(limit = 8) {
    const { data } = await this.client.get<{ data: PopularRouteItem[] }>(
      `/routes/popular?limit=${limit}`,
    );
    return data.data;
  }

  async listCities() {
    const { data } = await this.client.get<{ data: CityItem[] }>(
      "/locations/cities",
    );
    return data.data;
  }

  async searchRoutes(origin: string, destination: string) {
    const q = new URLSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
    });
    const { data } = await this.client.get<{ data: RouteSearchHit[] }>(
      `/routes/search?${q.toString()}`,
    );
    return data.data;
  }

  async schedulesForRoute(routeId: string, fromIso: string, toIso: string) {
    const q = new URLSearchParams({
      routeId,
      from: fromIso,
      to: toIso,
    });
    const { data } = await this.client.get<{ data: ScheduleHit[] }>(
      `/schedules/available?${q.toString()}`,
    );
    return data.data;
  }

  async scheduleById(scheduleId: string) {
    const { data } = await this.client.get<ScheduleHit>(
      `/schedules/available?scheduleId=${encodeURIComponent(scheduleId)}`,
    );
    return data;
  }

  async createBooking(scheduleId: string, seats: number[]) {
    const { data } = await this.client.post<{
      booking: {
        id: string;
        status: string;
        totalAmount: string;
        seats: number[];
      };
    }>("/bookings/create", { scheduleId, seats });
    return data.booking;
  }

  async listMyBookings() {
    const { data } = await this.client.get<{ data: unknown[] }>(
      "/bookings/user",
    );
    return data.data;
  }

  async initiateMpesa(bookingId: string, phoneNumber: string) {
    const { data } = await this.client.post<{
      paymentId: string;
      checkoutRequestId?: string;
      mock?: boolean;
    }>("/payments/mpesa/initiate", { bookingId, phoneNumber });
    return data;
  }

  async initiateChapa(
    bookingId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    const { data } = await this.client.post<{
      paymentId: string;
      checkoutUrl: string;
      txRef: string;
      mock?: boolean;
    }>("/payments/chapa/initiate", {
      bookingId,
      email,
      firstName,
      lastName,
    });
    return data;
  }

  static formatError(err: unknown): string {
    return apiMessage(err);
  }
}

export function createApi(
  baseUrl: string,
  getSession: () => BotSession,
): EthioTransitApi {
  return new EthioTransitApi(baseUrl, getSession);
}
