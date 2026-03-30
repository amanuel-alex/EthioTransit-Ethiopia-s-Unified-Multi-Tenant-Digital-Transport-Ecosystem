"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { AdminCompanyRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { adminSetCompanyStatusAction } from "@/lib/server/actions/admin";

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") {
    return (
      <Badge className="border-0 bg-emerald-500/20 font-semibold uppercase tracking-wide text-emerald-300">
        Active
      </Badge>
    );
  }
  if (s === "SUSPENDED") {
    return (
      <Badge className="border-0 bg-red-500/20 font-semibold uppercase tracking-wide text-red-300">
        Suspended
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [companies, setCompanies] = useState<AdminCompanyRow[] | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const c = await api.adminCompanies();
      setCompanies(c.data);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = companies ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [companies, filter]);

  const setStatus = async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    setBusyId(id);
    try {
      await adminSetCompanyStatusAction(id, status);
      toast.success(
        status === "ACTIVE" ? "Operator activated" : "Operator suspended",
      );
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Approve operations (activate) or suspend operators.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 bg-white/5">
          <Link href="/admin">← Overview</Link>
        </Button>
      </div>

      <OperatorGlassCard className="overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Input
            placeholder="Filter by name or slug…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm border-white/10 bg-white/5 text-zinc-100"
          />
        </div>
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-48 w-full bg-white/10" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Company</TableHead>
                <TableHead className="text-zinc-400">Fleet</TableHead>
                <TableHead className="text-zinc-400">Registered</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((co) => (
                <TableRow key={co.id} className="border-white/5">
                  <TableCell className="font-medium text-zinc-100">
                    {co.name}
                    <p className="text-xs text-zinc-500">{co.slug}</p>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {co._count?.buses ?? "—"} buses
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {new Date(co.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{statusBadge(co.status)}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {co.status === "SUSPENDED" ? (
                      <Button
                        size="sm"
                        disabled={busyId === co.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-500"
                        onClick={() => void setStatus(co.id, "ACTIVE")}
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === co.id}
                        className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                        onClick={() => void setStatus(co.id, "SUSPENDED")}
                      >
                        Suspend
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/settings?company=${co.id}`}>Settings</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </OperatorGlassCard>
    </div>
  );
}
