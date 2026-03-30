/**
 * Route group layout for platform admin routes under /admin.
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-surface min-h-0 flex-1">{children}</div>;
}
