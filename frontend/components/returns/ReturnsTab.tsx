"use client";

import { useState, useMemo } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import {
  useReturns,
  useSales,
  useCreateReturn,
  useUpdateReturn,
  useDeleteReturn,
} from "@/lib/api/hooks";
import type { Return, CreateReturnDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { formatCurrency, formatDate } from "@/lib/utils";

// ── Create return modal ──────────────────────────────────────────────────────
interface CreateReturnModalProps {
  open: boolean;
  onClose: () => void;
  saleOptions: { label: string; value: string }[];
}

function CreateReturnModal({ open, onClose, saleOptions }: CreateReturnModalProps) {
  const createMut = useCreateReturn();
  const [form, setForm] = useState<Partial<CreateReturnDto>>({
    sale_id:       "",
    reason:        "",
    refund_amount: 0,
    status:        "pending",
  });
  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const statusOptions = [
    { label: "Pending",   value: "pending" },
    { label: "Approved",  value: "approved" },
    { label: "Rejected",  value: "rejected" },
    { label: "Completed", value: "completed" },
  ];

  const handleSubmit = async () => {
    if (!form.sale_id) return;
    await createMut.mutateAsync({
      sale_id:       form.sale_id!,
      reason:        form.reason        || undefined,
      refund_amount: Number(form.refund_amount),
      status:        form.status        || "pending",
    });
    onClose();
    setForm({ sale_id: "", reason: "", refund_amount: 0, status: "pending" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Return Request" size="md">
      <div className="space-y-4">
        <Select
          label="Sale *"
          placeholder="Select sale…"
          options={saleOptions}
          value={form.sale_id}
          onChange={(v) => set("sale_id", v)}
        />
        <Input
          label="Reason"
          placeholder="Describe the return reason…"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Refund Amount"
            type="number"
            min={0}
            step="0.01"
            value={form.refund_amount}
            onChange={(e) => set("refund_amount", Math.max(0, Number(e.target.value)))}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(v) => set("status", v)}
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            loading={createMut.isPending}
            disabled={!form.sale_id}
            onClick={handleSubmit}
          >
            Submit Return
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Update status modal ──────────────────────────────────────────────────────
interface UpdateReturnModalProps {
  open: boolean;
  onClose: () => void;
  ret: Return | null;
}

function UpdateReturnModal({ open, onClose, ret }: UpdateReturnModalProps) {
  const updateMut = useUpdateReturn();
  const [status, setStatus] = useState(ret?.status ?? "pending");

  const statusOptions = [
    { label: "Pending",   value: "pending" },
    { label: "Approved",  value: "approved" },
    { label: "Rejected",  value: "rejected" },
    { label: "Completed", value: "completed" },
  ];

  const handleSubmit = async () => {
    if (!ret) return;
    await updateMut.mutateAsync({ id: ret.id, dto: { status } });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Return Status" size="sm">
      <div className="space-y-4">
        <Select
          label="New Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={updateMut.isPending} onClick={handleSubmit}>Update</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export function ReturnsTab() {
  const { data: returns, isLoading } = useReturns();
  const { data: sales }              = useSales();
  const deleteMut = useDeleteReturn();

  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRet, setEditRet]       = useState<Return | null>(null);
  const [editOpen, setEditOpen]     = useState(false);

  const saleOptions = (sales ?? []).map((s) => ({
    label: `#${s.id.slice(0, 8).toUpperCase()} — ${formatCurrency(parseFloat(s.total))}`,
    value: s.id,
  }));

  const statusOptions = [
    { label: "All",       value: "all" },
    { label: "Pending",   value: "pending" },
    { label: "Approved",  value: "approved" },
    { label: "Rejected",  value: "rejected" },
    { label: "Completed", value: "completed" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (returns ?? []).filter((r) => {
      const matchSearch = r.id.includes(q) || (r.reason ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [returns, search, statusFilter]);

  const pending  = (returns ?? []).filter((r) => r.status === "pending").length;
  const approved = (returns ?? []).filter((r) => r.status === "approved").length;
  const totalRefunds = (returns ?? []).reduce(
    (s, r) => s + parseFloat(r.refund_amount as string ?? "0"), 0,
  );

  const columns = [
    {
      key: "id",
      header: "Return #",
      render: (r: Return) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "sale_id",
      header: "Sale",
      render: (r: Return) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
          #{r.sale_id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r: Return) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {r.reason ?? "—"}
        </span>
      ),
    },
    {
      key: "refund_amount",
      header: "Refund",
      render: (r: Return) => (
        <span className="font-semibold" style={{ color: "var(--danger)" }}>
          {formatCurrency(parseFloat(r.refund_amount as string))}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r: Return) => (
        <span className="text-xs">{formatDate(r.created_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Return) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (r: Return) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditRet(r); setEditOpen(true); }}
          >
            Update
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMut.isPending}
            onClick={() => deleteMut.mutate(r.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Total Returns"
          value={(returns?.length ?? 0)}
          icon={<RotateCcw size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label="Pending"
          value={pending}
          icon={<RotateCcw size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label="Total Refunds"
          value={formatCurrency(totalRefunds)}
          icon={<RotateCcw size={18} />}
          accentColor="var(--danger)"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by ID or reason…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatus}
            className="w-36"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New Return
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No returns" description="Return requests will appear here." icon={<RotateCcw size={28} />} />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <CreateReturnModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        saleOptions={saleOptions}
      />
      <UpdateReturnModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditRet(null); }}
        ret={editRet}
      />
    </div>
  );
}
