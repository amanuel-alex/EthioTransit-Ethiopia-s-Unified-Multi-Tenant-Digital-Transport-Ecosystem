/**
 * Route group layout for operator console routes under /dashboard.
 */
export function OperatorLayout({ children }: { children: React.ReactNode }) {
  return <div className="operator-surface min-h-0 flex-1">{children}</div>;
}
