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
  createDriverAction,
  deleteDriverAction,
  updateDriverAction,
} from "@/lib/server/actions/operator";

type BusMini = { id: string; plateNumber: string };
type DriverRow = {
  id: string;
  fullName: string;
  salary: unknown;
  assignedBusId: string | null;
  assignedBus: BusMini | null;
};

export default function OperatorStaffPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useApi();
  const [rows, setRows] = useState<DriverRow[] | null>(null);
  const [buses, setBuses] = useState<BusMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DriverRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    salary: 15000,
    assignedBusId: "__none__" as string,
  });

  useEffect(() => {
    if (user?.role && user.role !== "COMPANY") router.replace("/home");
  }, [user?.role, router]);

  const load = useCallback(async () => {
    if (user?.role !== "COMPANY") return;
    setLoading(true);
    try {
      const [d, b] = await Promise.all([
        api.companyDrivers(),
        api.companyBuses(),
      ]);
      setRows((d.data as DriverRow[]) ?? []);
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
      toast.error(err.message ?? "Failed to load drivers");
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
      fullName: "",
      salary: 15000,
      assignedBusId: "__none__",
    });
    setOpen(true);
  };

  const openEdit = (row: DriverRow) => {
    setEditing(row);
    setForm({
      fullName: row.fullName,
      salary: Number(row.salary),
      assignedBusId: row.assignedBusId ?? "__none__",
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const assigned =
        form.assignedBusId === "__none__" ? null : form.assignedBusId;
      if (editing) {
        await updateDriverAction(editing.id, {
          fullName: form.fullName.trim(),
          salary: form.salary,
          assignedBusId: assigned,
        });
        toast.success("Driver updated");
      } else {
        await createDriverAction({
          fullName: form.fullName.trim(),
          salary: form.salary,
          assignedBusId: assigned,
        });
        toast.success("Driver added");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: DriverRow) => {
    if (!confirm(`Remove ${row.fullName}?`)) return;
    try {
      await deleteDriverAction(row.id);
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
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Drivers, salaries, and bus assignment.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full bg-[hsl(152,65%,44%)] font-semibold text-zinc-950"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add driver
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
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Salary (ETB)</TableHead>
                <TableHead className="text-zinc-400">Assigned bus</TableHead>
                <TableHead className="w-[100px] text-right text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="font-medium text-white">
                    {row.fullName}
                  </TableCell>
                  <TableCell className="tabular-nums text-zinc-300">
                    {String(row.salary)}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {row.assignedBus?.plateNumber ?? "—"}
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
        <DialogContent className="border-white/10 bg-[#0a0a0a] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Edit driver" : "New driver"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Monthly salary (ETB)</Label>
              <Input
                type="number"
                min={0}
                value={form.salary}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    salary: Number(e.target.value) || 0,
                  }))
                }
                className="border-white/10 bg-zinc-900/80 text-white"
              />
            </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Assign bus</Label>
                  <Select
                    value={form.assignedBusId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, assignedBusId: v }))
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-zinc-900/80 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !form.fullName.trim()}
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
