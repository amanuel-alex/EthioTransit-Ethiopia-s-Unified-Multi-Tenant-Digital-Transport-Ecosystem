/**
 * Route group for passenger pages. Shell chrome (light hub vs dark booking flow)
 * is decided in AppShell from the pathname — this wrapper only provides a stable
 * flex child for main content.
 */
export function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <div className="passenger-surface min-h-0 flex-1">{children}</div>;
}
