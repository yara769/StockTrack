"use client";

import { useState, useMemo } from "react";
import { Plus, Search, CreditCard, Banknote, Receipt } from "lucide-react";
import {
  usePayments,
  useSales,
  useCreatePayment,
  useDeletePayment,
} from "@/lib/api/hooks";
import type { Payment, CreatePaymentDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// ── Payment method icon ───────────────────────────────────────────────────────
function MethodIcon({ method }: { method: string }) {
  const m = method?.toLowerCase();
  if (m === "card")     return <CreditCard size={14} style={{ color: "var(--accent)" }} />;
  if (m === "transfer") return <Receipt    size={14} style={{ color: "#a78bfa" }} />;
  return                       <Banknote   size={14} style={{ color: "var(--amber)" }} />;
}

// ── Add payment modal ─────────────────────────────────────────────────────────
interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  saleOptions: { label: string; value: string }[];
}

function AddPaymentModal({ open, onClose, saleOptions }: AddPaymentModalProps) {
  const createMut = useCreatePayment();
  const [form, setForm] = useState<Partial<CreatePaymentDto>>({
    sale_id: "",
    method:  "cash",
    amount:  0,
    status:  "completed",
    ref:     "",
  });
  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const methodOptions = [
    { label: "Cash",     value: "cash" },
    { label: "Card",     value: "card" },
    { label: "Transfer", value: "transfer" },
  ];
  const statusOptions = [
    { label: "Completed", value: "completed" },
    { label: "Pending",   value: "pending" },
    { label: "Failed",    value: "failed" },
  ];

  const handleSubmit = async () => {
    if (!form.sale_id || !form.amount) return;
    await createMut.mutateAsync({
      sale_id: form.sale_id!,
      method:  form.method  || "cash",
      amount:  Number(form.amount),
      status:  form.status  || "completed",
      ref:     form.ref     || undefined,
      paid_at: new Date().toISOString(),
    });
    onClose();
    setForm({ sale_id: "", method: "cash", amount: 0, status: "completed", ref: "" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" size="md">
      <div className="space-y-4">
        <Select
          label="Sale *"
          placeholder="Select sale…"
          options={saleOptions}
          value={form.sale_id}
          onChange={(v) => set("sale_id", v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Method"
            options={methodOptions}
            value={form.method}
            onChange={(v) => set("method", v)}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(v) => set("status", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount *"
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))}
          />
          <Input
            label="Reference"
            placeholder="Optional"
            value={form.ref}
            onChange={(e) => set("ref", e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            loading={createMut.isPending}
            disabled={!form.sale_id || !form.amount}
            onClick={handleSubmit}
          >
            Record Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function PaymentsTab() {
  const { data: payments, isLoading } = usePayments();
  const { data: sales }               = useSales();
  const deleteMut = useDeletePayment();

  const [search, setSearch]         = useState("");
  const [methodFilter, setMethod]   = useState("all");
  const [addOpen, setAddOpen]       = useState(false);

  const saleOptions = (sales ?? []).map((s) => ({
    label: `#${s.id.slice(0, 8).toUpperCase()} — ${formatCurrency(parseFloat(s.total))}`,
    value: s.id,
  }));

  const methodOptions = [
    { label: "All Methods", value: "all" },
    { label: "Cash",        value: "cash" },
    { label: "Card",        value: "card" },
    { label: "Transfer",    value: "transfer" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...(payments ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((p) => {
        const matchSearch = p.id.includes(q) || p.sale_id.includes(q) || (p.ref ?? "").toLowerCase().includes(q);
        const matchMethod = methodFilter === "all" || p.method === methodFilter;
        return matchSearch && matchMethod;
      });
  }, [payments, search, methodFilter]);

  const totalCollected = (payments ?? [])
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + parseFloat(p.amount as string ?? "0"), 0);

  const cashTotal = (payments ?? [])
    .filter((p) => p.method === "cash" && p.status === "completed")
    .reduce((s, p) => s + parseFloat(p.amount as string ?? "0"), 0);

  const cardTotal = (payments ?? [])
    .filter((p) => p.method !== "cash" && p.status === "completed")
    .reduce((s, p) => s + parseFloat(p.amount as string ?? "0"), 0);

  const columns = [
    {
      key: "id",
      header: "Payment #",
      render: (r: Payment) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "sale_id",
      header: "Sale",
      render: (r: Payment) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
          #{r.sale_id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (r: Payment) => (
        <div className="flex items-center gap-2">
          <MethodIcon method={r.method} />
          <span className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>
            {r.method}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (r: Payment) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.amount as string))}
        </span>
      ),
    },
    {
      key: "ref",
      header: "Ref",
      render: (r: Payment) => (
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {r.ref ?? "—"}
        </span>
      ),
    },
    {
      key: "paid_at",
      header: "Paid At",
      render: (r: Payment) => (
        <span className="text-xs">{formatDateTime(r.paid_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Payment) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (r: Payment) => (
        <Button
          variant="danger"
          size="sm"
          loading={deleteMut.isPending}
          onClick={() => deleteMut.mutate(r.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={<CreditCard size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label="Cash"
          value={formatCurrency(cashTotal)}
          icon={<Banknote size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label="Card / Transfer"
          value={formatCurrency(cardTotal)}
          icon={<CreditCard size={18} />}
          accentColor="#a78bfa"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by ID, sale or ref…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select
            options={methodOptions}
            value={methodFilter}
            onChange={setMethod}
            className="w-40"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Record Payment
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No payments" description="Payment records will appear here." icon={<CreditCard size={28} />} />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <AddPaymentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        saleOptions={saleOptions}
      />
    </div>
  );
}
