/**
 * Route group layout for passenger-only pages (home, search flow, bookings).
 */
export function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <div className="passenger-surface min-h-0 flex-1">{children}</div>;
}
