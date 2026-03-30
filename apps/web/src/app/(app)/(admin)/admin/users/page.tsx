"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

type UserRow = {
  id: string;
  phone: string;
  role: string;
  companyId: string | null;
  createdAt: string;
  company: { name: string; slug: string } | null;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const r = await api.adminUsers({
        page,
        limit: 25,
        role: role === "all" ? undefined : role,
      });
      setRows(r.data as UserRow[]);
      setTotalPages(Math.max(1, r.totalPages));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, page, role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-zinc-400">All platform accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[10rem] border-white/10 bg-white/5 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="PASSENGER">Passenger</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline" className="border-white/15 bg-white/5">
            <Link href="/admin">Overview</Link>
          </Button>
        </div>
      </div>

      <OperatorGlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-48 w-full bg-white/10" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Phone</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Company</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-white/5">
                    <TableCell className="font-medium text-zinc-100">
                      {r.phone}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase">
                        {r.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {r.company?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <span className="text-xs text-zinc-500">Page {page}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </OperatorGlassCard>
    </div>
  );
}
