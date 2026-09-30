"use client";

import { useState, useMemo } from "react";
import { Plus, Search, CreditCard, Banknote, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  usePayments,
  useSales,
  useCreatePayment,
  useDeletePayment,
} from "@/lib/api/hooks";
import type { Payment, CreatePaymentDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// M-03: typed lookup table avoids dynamic key with `as any`
const METHOD_LABEL_KEYS = {
  cash:     "methods.cash",
  card:     "methods.card",
  transfer: "methods.transfer",
} as const satisfies Record<string, `methods.${string}`>;
function MethodIcon({ method }: { method: string }) {
  const m = method?.toLowerCase();
  if (m === "card")
    return <CreditCard size={14} style={{ color: "var(--accent)" }} />;
  if (m === "transfer")
    return <Receipt size={14} style={{ color: "#a78bfa" }} />;
  return <Banknote size={14} style={{ color: "var(--amber)" }} />;
}

// ── Add payment modal ─────────────────────────────────────────────────────────
interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  saleOptions: { label: string; value: string }[];
}

function AddPaymentModal({ open, onClose, saleOptions }: AddPaymentModalProps) {
  const t = useTranslations("payments");
  const createMut = useCreatePayment();
  const [form, setForm] = useState<Partial<CreatePaymentDto>>({
    sale_id: "",
    method: "cash",
    amount: 0,
    status: "completed",
    ref: "",
  });
  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const methodOptions = [
    { label: t("methods.cash"), value: "cash" },
    { label: t("methods.card"), value: "card" },
    { label: t("methods.transfer"), value: "transfer" },
  ];
  const statusOptions = [
    { label: t("status.completed"), value: "completed" },
    { label: t("status.pending"), value: "pending" },
    { label: t("status.failed"), value: "failed" },
  ];

  const handleSubmit = async () => {
    if (!form.sale_id || !form.amount) return;
    await createMut.mutateAsync({
      sale_id: form.sale_id!,
      method: form.method || "cash",
      amount: Number(form.amount),
      status: form.status || "completed",
      ref: form.ref || undefined,
      paid_at: new Date().toISOString(),
    });
    onClose();
    setForm({
      sale_id: "",
      method: "cash",
      amount: 0,
      status: "completed",
      ref: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modals.record_title")}
      size="md"
    >
      <div className="space-y-4">
        <Select
          label={t("modals.sale_label")}
          placeholder={t("modals.sale_placeholder")}
          options={saleOptions}
          value={form.sale_id}
          onChange={(v) => set("sale_id", v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("modals.method_label")}
            options={methodOptions}
            value={form.method}
            onChange={(v) => set("method", v)}
          />
          <Select
            label={t("modals.status_label")}
            options={statusOptions}
            value={form.status}
            onChange={(v) => set("status", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("modals.amount_label")}
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))}
          />
          <Input
            label={t("modals.ref_label")}
            placeholder={t("modals.ref_placeholder")}
            value={form.ref}
            onChange={(e) => set("ref", e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("buttons.cancel")}
          </Button>
          <Button
            loading={createMut.isPending}
            disabled={!form.sale_id || !form.amount}
            onClick={handleSubmit}
          >
            {t("buttons.record_payment")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function PaymentsTab() {
  const t = useTranslations("payments");
  const { data: payments, isLoading } = usePayments();
  const { data: sales } = useSales();
  const deleteMut = useDeletePayment();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethod] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const saleOptions = (sales ?? []).map((s) => ({
    label: `#${s.id.slice(0, 8).toUpperCase()} — ${formatCurrency(parseFloat(s.total))}`,
    value: s.id,
  }));

  const methodOptions = [
    { label: t("methods.all"), value: "all" },
    { label: t("methods.cash"), value: "cash" },
    { label: t("methods.card"), value: "card" },
    { label: t("methods.transfer"), value: "transfer" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...(payments ?? [])]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .filter((p) => {
        const matchSearch =
          p.id.includes(q) ||
          p.sale_id.includes(q) ||
          (p.ref ?? "").toLowerCase().includes(q);
        const matchMethod = methodFilter === "all" || p.method === methodFilter;
        return matchSearch && matchMethod;
      });
  }, [payments, search, methodFilter]);

  const totalCollected = (payments ?? [])
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + parseFloat((p.amount as string) ?? "0"), 0);

  const cashTotal = (payments ?? [])
    .filter((p) => p.method === "cash" && p.status === "completed")
    .reduce((s, p) => s + parseFloat((p.amount as string) ?? "0"), 0);

  const cardTotal = (payments ?? [])
    .filter((p) => p.method !== "cash" && p.status === "completed")
    .reduce((s, p) => s + parseFloat((p.amount as string) ?? "0"), 0);

  const columns = [
    {
      key: "id",
      header: t("table.payment_no"),
      render: (r: Payment) => (
        <span
          className="font-mono text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "sale_id",
      header: t("table.sale"),
      render: (r: Payment) => (
        <span
          className="font-mono text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          #{r.sale_id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "method",
      header: t("table.method"),
      render: (r: Payment) => (
        <div className="flex items-center gap-2">
          <MethodIcon method={r.method} />
          <span
            className="text-sm capitalize"
            style={{ color: "var(--text-secondary)" }}
          >
            {t(METHOD_LABEL_KEYS[r.method.toLowerCase() as keyof typeof METHOD_LABEL_KEYS] ?? "methods.cash")}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: t("table.amount"),
      render: (r: Payment) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.amount as string))}
        </span>
      ),
    },
    {
      key: "ref",
      header: t("table.ref"),
      render: (r: Payment) => (
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {r.ref ?? "—"}
        </span>
      ),
    },
    {
      key: "paid_at",
      header: t("table.paid_at"),
      render: (r: Payment) => (
        <span className="text-xs">{formatDateTime(r.paid_at)}</span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
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
          {t("buttons.delete")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label={t("stats.total_collected")}
          value={formatCurrency(totalCollected)}
          icon={<CreditCard size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label={t("stats.cash")}
          value={formatCurrency(cashTotal)}
          icon={<Banknote size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label={t("stats.card_transfer")}
          value={formatCurrency(cardTotal)}
          icon={<CreditCard size={18} />}
          accentColor="#a78bfa"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder={t("filters.search_placeholder")}
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
          {t("buttons.record_payment")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("empty_state.title")}
          description={t("empty_state.description")}
          icon={<CreditCard size={28} />}
        />
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
