"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { OperatorGlassCard } from "@/components/dashboard/operator-glass-card";
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
import {
  createRouteAction,
  deleteRouteAction,
  updateRouteAction,
} from "@/lib/server/actions/operator";

type RouteRow = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: unknown;
  pricePerKm: unknown | null;
};

export default function OperatorRoutesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<RouteRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    distanceKm: 100,
    pricePerKm: "" as string,
  });

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const r = await api.companyRoutes();
      setRows((r.data as RouteRow[]) ?? []);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      origin: "",
      destination: "",
      distanceKm: 100,
      pricePerKm: "",
    });
    setOpen(true);
  };

  const openEdit = (row: RouteRow) => {
    setEditing(row);
    setForm({
      origin: row.origin,
      destination: row.destination,
      distanceKm: Number(row.distanceKm),
      pricePerKm:
        row.pricePerKm != null ? String(row.pricePerKm) : "",
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const price =
        form.pricePerKm.trim() === ""
          ? null
          : Number(form.pricePerKm);
      if (price != null && Number.isNaN(price)) {
        toast.error("Invalid price per km");
        setSaving(false);
        return;
      }
      if (editing) {
        await updateRouteAction(editing.id, {
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          distanceKm: form.distanceKm,
          pricePerKm: price,
        });
        toast.success("Route updated");
      } else {
        await createRouteAction({
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          distanceKm: form.distanceKm,
          pricePerKm: price ?? undefined,
        });
        toast.success("Route created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: RouteRow) => {
    if (!confirm(`Delete route ${row.origin} → ${row.destination}?`)) return;
    try {
      await deleteRouteAction(row.id);
      toast.success("Route deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Delete failed");
    }
  };

  if (user?.role !== "COMPANY") return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Routes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Origin, destination, distance, and optional price per km.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full bg-[hsl(152,65%,44%)] font-semibold text-zinc-950"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add route
        </Button>
      </div>

      <OperatorGlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-40 w-full bg-white/10" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">From</TableHead>
                <TableHead className="text-zinc-400">To</TableHead>
                <TableHead className="text-zinc-400">Km</TableHead>
                <TableHead className="text-zinc-400">ETB / km</TableHead>
                <TableHead className="w-[100px] text-right text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((r) => (
                <TableRow key={r.id} className="border-white/10">
                  <TableCell className="font-medium text-white">
                    {r.origin}
                  </TableCell>
                  <TableCell className="text-zinc-300">{r.destination}</TableCell>
                  <TableCell className="tabular-nums text-zinc-300">
                    {String(r.distanceKm)}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {r.pricePerKm != null ? String(r.pricePerKm) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400"
                      onClick={() => remove(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </OperatorGlassCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#0a0a0a] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Edit route" : "New route"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">From</Label>
              <Input
                value={form.origin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, origin: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">To</Label>
              <Input
                value={form.destination}
                onChange={(e) =>
                  setForm((f) => ({ ...f, destination: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Distance (km)</Label>
              <Input
                type="number"
                min={1}
                value={form.distanceKm}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    distanceKm: Number(e.target.value) || 1,
                  }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Price per km (optional)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Suggest for pricing"
                value={form.pricePerKm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerKm: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                saving ||
                !form.origin.trim() ||
                !form.destination.trim() ||
                form.distanceKm < 1
              }
              onClick={() => void submit()}
              className="bg-[hsl(152,65%,44%)] font-semibold text-zinc-950"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
