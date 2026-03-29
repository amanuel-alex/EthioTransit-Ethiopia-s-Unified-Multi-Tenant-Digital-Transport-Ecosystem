export type UserRole = "PASSENGER" | "COMPANY" | "ADMIN";

export type AuthUser = {
  id: string;
  phone: string;
  role: UserRole;
  companyId: string | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RouteSearchRow = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  companyId: string;
  company: { id: string; name: string; slug: string | null };
};

export type ScheduleDetail = {
  schedule: {
    id: string;
    departsAt: string;
    arrivesAt: string;
    basePrice: string;
    route: {
      id: string;
      origin: string;
      destination: string;
      distanceKm: number;
      companyId: string;
    };
    bus: { id: string; plateNumber: string; seatCapacity: number };
  };
  availableSeats: number[];
  occupiedSeats: number[];
};

export type CreateBookingResponse = {
  booking: {
    id: string;
    status: string;
    totalAmount: string;
    platformFee: string;
    companyEarning: string;
    seats: number[];
  };
};

export type BookingRow = {
  id: string;
  status: string;
  totalAmount: unknown;
  currency: string;
  createdAt: string;
  user?: { id: string; phone: string };
  schedule: {
    id: string;
    departsAt: string;
    arrivesAt: string;
    route: { origin: string; destination: string };
    bus: { plateNumber: string };
  };
  seats: { seatNo: number }[];
};

export type MpesaInitResponse = {
  paymentId: string;
  checkoutRequestId?: string | null;
  merchantRequestId?: string | null;
  idempotent?: boolean;
};

export type ChapaInitResponse = {
  paymentId: string;
  checkoutUrl: string;
  txRef: string;
};

export type CompanyDashboardStats = {
  bookingsToday: number;
  pendingBookings: number;
  paidBookingsLast30Days: number;
  revenueCompleted: {
    count: number;
    gross: string;
    platformFees: string;
    companyEarnings: string;
  };
};

export type AdminCompanyRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  _count?: { buses: number };
};
