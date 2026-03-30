"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { OperatorApplicationRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PENDING") {
    return (
      <Badge className="border-0 bg-amber-500/20 font-semibold uppercase tracking-wide text-amber-200">
        Pending
      </Badge>
    );
  }
  if (s === "APPROVED") {
    return (
      <Badge className="border-0 bg-emerald-500/20 font-semibold uppercase tracking-wide text-emerald-300">
        Approved
      </Badge>
    );
  }
  if (s === "REJECTED") {
    return (
      <Badge className="border-0 bg-red-500/20 font-semibold uppercase tracking-wide text-red-300">
        Rejected
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
}

export default function AdminOperatorApplicationsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<OperatorApplicationRow[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OperatorApplicationRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (user?.role && user.role !== "ADMIN") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await api.adminOperatorApplications({
        page,
        limit: 15,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setRows(res.data);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router, page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await api.adminReviewOperatorApplication(id, { action: "approve" });
      toast.success("Operator approved — company and login created");
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (row: OperatorApplicationRow) => {
    setRejectTarget(row);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await api.adminReviewOperatorApplication(rejectTarget.id, {
        action: "reject",
        reason: rejectReason.trim() || null,
      });
      toast.success("Application rejected");
      setRejectOpen(false);
      setRejectTarget(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operator applications</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Approve to create an active company and link the applicant phone as{" "}
            <span className="text-zinc-300">COMPANY</span> user.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setPage(1);
              setStatusFilter(v);
            }}
          >
            <SelectTrigger className="w-[160px] border-white/15 bg-white/5 text-zinc-100">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Company</TableHead>
                <TableHead className="text-zinc-400">Slug</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).length === 0 ? (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                    No applications in this view.
                  </TableCell>
                </TableRow>
              ) : (
                (rows ?? []).map((r) => (
                  <TableRow key={r.id} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      <div>{r.legalName}</div>
                      {r.applicantEmail ? (
                        <div className="text-xs font-normal text-zinc-500">{r.applicantEmail}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-zinc-300">{r.slug}</TableCell>
                    <TableCell className="text-zinc-300">{r.applicantPhone}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="rounded-lg bg-[hsl(152,65%,46%)] text-white hover:bg-[hsl(152,65%,40%)]"
                            disabled={busyId === r.id}
                            onClick={() => void approve(r.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-white/15"
                            disabled={busyId === r.id}
                            onClick={() => openReject(r)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : r.status === "APPROVED" && r.company ? (
                        <Link
                          href="/admin/companies"
                          className={cn(
                            "text-xs font-medium text-[hsl(152,65%,52%)] underline",
                            "decoration-[hsl(152,65%,48%)]/40 underline-offset-2",
                          )}
                        >
                          {r.company.name}
                        </Link>
                      ) : r.rejectReason ? (
                        <span className="text-xs text-zinc-500" title={r.rejectReason}>
                          {r.rejectReason.slice(0, 40)}
                          {r.rejectReason.length > 40 ? "…" : ""}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </OperatorGlassCard>

      {totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/15"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-2 text-sm text-zinc-400">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            {rejectTarget?.legalName} ({rejectTarget?.slug})
          </p>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-zinc-300">
              Reason (optional)
            </Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Brief note for internal records"
              className="border-white/15 bg-zinc-900"
              maxLength={500}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!!busyId} onClick={() => void confirmReject()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
