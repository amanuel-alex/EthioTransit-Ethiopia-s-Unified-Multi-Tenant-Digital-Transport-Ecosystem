"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
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
import { routeLineLabel, type RouteWithStations } from "@/lib/route-label";
import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/lib/server/actions/operator";

type RouteMini = RouteWithStations & { id: string };
type BusMini = { id: string; plateNumber: string };
type ScheduleRow = {
  id: string;
  departsAt: string;
  arrivesAt: string;
  basePrice: unknown;
  route: RouteMini;
  bus: BusMini;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OperatorSchedulesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<ScheduleRow[] | null>(null);
  const [routes, setRoutes] = useState<RouteMini[]>([]);
  const [buses, setBuses] = useState<BusMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    routeId: "",
    busId: "",
    departsLocal: "",
    arrivesLocal: "",
    basePrice: 400,
  });

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const [s, r, b] = await Promise.all([
        api.companySchedules(),
        api.companyRoutes(),
        api.companyBuses(),
      ]);
      setRows((s.data as ScheduleRow[]) ?? []);
      setRoutes((r.data as RouteMini[]) ?? []);
      setBuses(
        ((b.data as { id: string; plateNumber: string }[]) ?? []).map((x) => ({
          id: x.id,
          plateNumber: x.plateNumber,
        })),
      );
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        logout();
        router.push("/auth");
        return;
      }
      toast.error(err.message ?? "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [api, user?.role, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    const base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(6, 0, 0, 0);
    const end = new Date(base);
    end.setHours(12, 0, 0, 0);
    setForm({
      routeId: routes[0]?.id ?? "",
      busId: buses[0]?.id ?? "",
      departsLocal: toLocalInput(base.toISOString()),
      arrivesLocal: toLocalInput(end.toISOString()),
      basePrice: 400,
    });
    setOpen(true);
  };

  const openEdit = (row: ScheduleRow) => {
    setEditing(row);
    setForm({
      routeId: row.route.id,
      busId: row.bus.id,
      departsLocal: toLocalInput(row.departsAt),
      arrivesLocal: toLocalInput(row.arrivesAt),
      basePrice: Number(row.basePrice),
    });
    setOpen(true);
  };

  const submit = async () => {
    const departsAt = new Date(form.departsLocal).toISOString();
    const arrivesAt = new Date(form.arrivesLocal).toISOString();
    if (new Date(arrivesAt) <= new Date(departsAt)) {
      toast.error("Arrival must be after departure");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateScheduleAction(editing.id, {
          routeId: form.routeId,
          busId: form.busId,
          departsAt,
          arrivesAt,
          basePrice: form.basePrice,
        });
        toast.success("Schedule updated");
      } else {
        await createScheduleAction({
          routeId: form.routeId,
          busId: form.busId,
          departsAt,
          arrivesAt,
          basePrice: form.basePrice,
        });
        toast.success("Schedule created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ScheduleRow) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await deleteScheduleAction(row.id);
      toast.success("Removed");
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
          <h1 className="text-2xl font-bold text-white">Schedules</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tie routes to buses with departure times and base fare.
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!routes.length || !buses.length}
          className="rounded-full bg-[hsl(152,65%,44%)] font-semibold text-zinc-950"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add schedule
        </Button>
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
                <TableHead className="text-zinc-400">Route</TableHead>
                <TableHead className="text-zinc-400">Bus</TableHead>
                <TableHead className="text-zinc-400">Departs</TableHead>
                <TableHead className="text-zinc-400">Arrives</TableHead>
                <TableHead className="text-zinc-400">Fare</TableHead>
                <TableHead className="w-[100px] text-right text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="max-w-[240px] text-white">
                    {routeLineLabel(row.route)}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {row.bus.plateNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-400 text-sm">
                    {new Date(row.departsAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-400 text-sm">
                    {new Date(row.arrivesAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="tabular-nums text-zinc-300">
                    {String(row.basePrice)} ETB
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400"
                      onClick={() => remove(row)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0a0a0a] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CalendarDays className="h-5 w-5 text-[hsl(152,65%,48%)]" />
              {editing ? "Edit schedule" : "New schedule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Route</Label>
              <Select
                value={form.routeId}
                onValueChange={(v) => setForm((f) => ({ ...f, routeId: v }))}
              >
                <SelectTrigger className="border-white/10 bg-zinc-900/80 text-white">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {routeLineLabel(route)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Bus</Label>
              <Select
                value={form.busId}
                onValueChange={(v) => setForm((f) => ({ ...f, busId: v }))}
              >
                <SelectTrigger className="border-white/10 bg-zinc-900/80 text-white">
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Departure</Label>
              <Input
                type="datetime-local"
                value={form.departsLocal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, departsLocal: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Arrival</Label>
              <Input
                type="datetime-local"
                value={form.arrivesLocal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, arrivesLocal: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Base price (ETB)</Label>
              <Input
                type="number"
                min={0}
                value={form.basePrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    basePrice: Number(e.target.value) || 0,
                  }))
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
                !form.routeId ||
                !form.busId ||
                !form.departsLocal ||
                !form.arrivesLocal
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
