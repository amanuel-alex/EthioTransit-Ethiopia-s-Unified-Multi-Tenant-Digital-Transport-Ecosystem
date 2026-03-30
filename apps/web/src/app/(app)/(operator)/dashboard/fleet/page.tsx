"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/lib/auth/auth-context";
import {
  createBusAction,
  deleteBusAction,
  updateBusAction,
} from "@/lib/server/actions/operator";

type BusRow = {
  id: string;
  plateNumber: string;
  seatCapacity: number;
  costPerKm: unknown;
  status: string;
  imageUrl?: string | null;
  vehicleName?: string | null;
  assignedDriver?: { id: string; fullName: string } | null;
};

const STATUSES = ["ACTIVE", "MAINTENANCE", "INACTIVE"] as const;

export default function FleetManagementPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<BusRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plateNumber: "",
    seatCapacity: 45,
    costPerKm: 12,
    status: "ACTIVE" as string,
    imageUrl: "" as string,
    vehicleName: "" as string,
  });

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const r = await api.companyBuses();
      setRows((r.data as BusRow[]) ?? []);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load buses");
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
      plateNumber: "",
      seatCapacity: 45,
      costPerKm: 12,
      status: "ACTIVE",
      imageUrl: "",
      vehicleName: "",
    });
    setOpen(true);
  };

  const openEdit = (b: BusRow) => {
    setEditing(b);
    setForm({
      plateNumber: b.plateNumber,
      seatCapacity: b.seatCapacity,
      costPerKm: Number(b.costPerKm),
      status: b.status,
      imageUrl: b.imageUrl ?? "",
      vehicleName: b.vehicleName ?? "",
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateBusAction(editing.id, {
          plateNumber: form.plateNumber.trim(),
          seatCapacity: form.seatCapacity,
          costPerKm: form.costPerKm,
          status: form.status,
          imageUrl: form.imageUrl.trim(),
          vehicleName: form.vehicleName.trim() || null,
        });
        toast.success("Bus updated");
      } else {
        await createBusAction({
          plateNumber: form.plateNumber.trim(),
          seatCapacity: form.seatCapacity,
          costPerKm: form.costPerKm,
          status: form.status,
          imageUrl: form.imageUrl.trim(),
          vehicleName: form.vehicleName.trim() || undefined,
        });
        toast.success("Bus added");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: BusRow) => {
    if (!confirm(`Remove bus ${b.plateNumber}?`)) return;
    try {
      await deleteBusAction(b.id);
      toast.success("Bus removed");
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
          <h1 className="text-2xl font-bold text-white">Fleet</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Add a photo URL and vehicle name — passengers see them on tickets and
            home after booking.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full bg-[hsl(152,65%,44%)] font-semibold text-zinc-950 hover:bg-[hsl(152,65%,50%)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add bus
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
                <TableHead className="w-14 text-zinc-400">Photo</TableHead>
                <TableHead className="text-zinc-400">Plate</TableHead>
                <TableHead className="text-zinc-400">Capacity</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Cost / km</TableHead>
                <TableHead className="text-zinc-400">Driver</TableHead>
                <TableHead className="w-[100px] text-right text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((b) => (
                <TableRow key={b.id} className="border-white/10">
                  <TableCell className="font-medium text-white">
                    {b.plateNumber}
                  </TableCell>
                  <TableCell className="text-zinc-300">{b.seatCapacity}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="border-0 bg-white/10 capitalize text-zinc-200"
                    >
                      {b.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-zinc-300">
                    {String(b.costPerKm)} ETB
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {b.assignedDriver?.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => openEdit(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400"
                      onClick={() => remove(b)}
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
              {editing ? "Edit bus" : "Add bus"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Plate number</Label>
              <Input
                value={form.plateNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plateNumber: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Seat capacity</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={form.seatCapacity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    seatCapacity: Number(e.target.value) || 1,
                  }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Cost per km (ETB)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.costPerKm}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    costPerKm: Number(e.target.value) || 0,
                  }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Vehicle name (passengers)</Label>
              <Input
                value={form.vehicleName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehicleName: e.target.value }))
                }
                placeholder="e.g. Volvo 9700 Coach"
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Vehicle photo URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                placeholder="https://… (hosted image link)"
                className="border-white/10 bg-zinc-900/80 text-white"
              />
              <p className="text-xs text-zinc-500">
                Paste a direct link to an image (e.g. from your site or Unsplash).
                Clear the field to remove.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="border-white/10 bg-zinc-900/80 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-zinc-200"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                saving || !form.plateNumber.trim() || form.seatCapacity < 1
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
