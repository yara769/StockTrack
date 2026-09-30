"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Eye, Truck, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  usePurchaseOrders,
  usePoItems,
  useSuppliers,
  useStores,
  useProducts,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useCreatePoItem,
} from "@/lib/api/hooks";
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  CreatePoItemDto,
} from "@/lib/api/types";
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
import { motion, AnimatePresence } from "framer-motion";

// ── PO line-item row in create form ─────────────────────────────────────────
interface DraftItem {
  id: string;          // stable unique id — prevents Framer Motion key collision on reorder
  product_id: string;
  qty: number;
  unit_cost: number;
}

// ── Create PO modal ──────────────────────────────────────────────────────────
interface CreatePOModalProps {
  open: boolean;
  onClose: () => void;
  supplierOptions: { label: string; value: string }[];
  storeOptions: { label: string; value: string }[];
  productOptions: { label: string; value: string }[];
}

function CreatePOModal({
  open,
  onClose,
  supplierOptions,
  storeOptions,
  productOptions,
}: CreatePOModalProps) {
  const t = useTranslations("purchase_orders");
  const createPO = useCreatePurchaseOrder();
  const createPoItem = useCreatePoItem();

  const [supplier_id, setSupplier] = useState("");
  const [store_id, setStore] = useState("");
  const [expected_at, setExpected] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { id: crypto.randomUUID(), product_id: "", qty: 1, unit_cost: 0 },
  ]);

  const total = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);

  const setItem = (idx: number, key: keyof DraftItem, val: string | number) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    );

  const addItem = () =>
    setItems((p) => [...p, { id: crypto.randomUUID(), product_id: "", qty: 1, unit_cost: 0 }]);
  const removeItem = (idx: number) =>
    setItems((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!supplier_id || !store_id) return;

    const invalidItems = items.filter(
      (i) => i.product_id && (Number(i.qty) < 1 || Number(i.unit_cost) < 0),
    );
    if (invalidItems.length > 0) {
      return;
    }

    const dto: CreatePurchaseOrderDto = {
      supplier_id,
      store_id,
      status: "pending",
      ordered_at: new Date().toISOString(),
      expected_at: expected_at || undefined,
    };
    const po = await createPO.mutateAsync(dto);

    await Promise.all(
      items
        .filter((i) => i.product_id)
        .map((i) =>
          createPoItem.mutateAsync({
            po_id: po.id,
            product_id: i.product_id,
            qty: Number(i.qty),
            unit_cost: Number(i.unit_cost),
          } as CreatePoItemDto),
        ),
    );
    onClose();
    setSupplier("");
    setStore("");
    setExpected("");
    setItems([{ id: crypto.randomUUID(), product_id: "", qty: 1, unit_cost: 0 }]);
  };

  const loading = createPO.isPending || createPoItem.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modals.create_title")}
      size="xl"
    >
      <div className="space-y-5">
        {/* Header fields */}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label={t("modals.supplier_label")}
            placeholder={t("modals.supplier_placeholder")}
            options={supplierOptions}
            value={supplier_id}
            onChange={setSupplier}
          />
          <Select
            label={t("modals.store_label")}
            placeholder={t("modals.store_placeholder")}
            options={storeOptions}
            value={store_id}
            onChange={setStore}
          />
          <Input
            label={t("modals.expected_date_label")}
            type="date"
            value={expected_at}
            onChange={(e) => setExpected(e.target.value)}
          />
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("modals.items_title")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={13} />}
              onClick={addItem}
            >
              {t("buttons.add_row")}
            </Button>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* column headers */}
            <div
              className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              <span className="col-span-5">{t("modals.product_header")}</span>
              <span className="col-span-2 text-center">
                {t("modals.qty_header")}
              </span>
              <span className="col-span-3 text-center">
                {t("modals.unit_cost_header")}
              </span>
              <span className="col-span-1 text-right">
                {t("modals.total_header")}
              </span>
              <span className="col-span-1" />
            </div>

            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 border-t"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="col-span-5">
                    <Select
                      options={productOptions}
                      value={item.product_id}
                      onChange={(v) => setItem(idx, "product_id", v)}
                      placeholder={t("modals.product_placeholder")}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => setItem(idx, "qty", e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) =>
                        setItem(idx, "unit_cost", e.target.value)
                      }
                      className="text-center"
                    />
                  </div>
                  <span
                    className="col-span-1 text-right text-xs font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {formatCurrency(item.qty * item.unit_cost)}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeItem(idx)}>
                      <Trash2 size={14} style={{ color: "var(--danger)" }} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* footer total */}
            <div
              className="flex justify-between items-center px-4 py-3 text-sm font-semibold border-t"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                {t("table.total")}
              </span>
              <span style={{ color: "var(--accent)" }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("buttons.cancel")}
          </Button>
          <Button
            loading={loading}
            disabled={!supplier_id || !store_id}
            onClick={handleSubmit}
          >
            {t("buttons.place_order")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── PO Detail modal ──────────────────────────────────────────────────────────
function PODetailModal({
  po,
  open,
  onClose,
}: {
  po: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("purchase_orders");
  const { data: allItems } = usePoItems();
  const updatePO = useUpdatePurchaseOrder();

  if (!po) return null;
  const items = (allItems ?? []).filter((i) => i.po_id === po.id);

  const markReceived = async () => {
    await updatePO.mutateAsync({ id: po.id, dto: { status: "received" } });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`PO #${po.id.slice(0, 8).toUpperCase()}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: t("table.supplier"),
              value: po.supplier?.name ?? po.supplier_id.slice(0, 8),
            },
            {
              label: t("table.store"),
              value: po.store?.name ?? po.store_id.slice(0, 8),
            },
            {
              label: t("table.status"),
              value: <StatusBadge status={po.status} />,
            },
            { label: t("table.ordered"), value: formatDate(po.ordered_at) },
            { label: t("table.expected"), value: formatDate(po.expected_at) },
            {
              label: t("table.total"),
              value: (
                <span style={{ color: "var(--accent)" }}>
                  {formatCurrency(parseFloat(po.total))}
                </span>
              ),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-elevated)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <div
                className="mt-0.5 text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("modals.items_title")}
          </p>
          <div
            className="rounded-xl overflow-hidden divide-y"
            style={{ border: "1px solid var(--border)" }}
          >
            {items.length === 0 && (
              <p
                className="px-4 py-3 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {t("modals.no_items")}
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-4 items-center px-4 py-3 text-sm"
                style={{ background: "var(--bg-elevated)" }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  {item.product?.name ?? item.product_id.slice(0, 8)}
                </span>
                <span
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  ordered: {item.qty}
                </span>
                <span
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  received: {item.received_qty}
                </span>
                <span
                  className="text-right font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {formatCurrency(parseFloat(item.total as string))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {po.status === "pending" && (
          <div className="flex justify-end">
            <Button
              icon={<Truck size={16} />}
              loading={updatePO.isPending}
              onClick={markReceived}
            >
              {t("buttons.mark_as_received")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export function PurchaseOrdersTab() {
  const t = useTranslations("purchase_orders");
  const { data: pos, isLoading } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const { data: stores } = useStores();
  const { data: products } = useProducts();
  const deleteMut = useDeletePurchaseOrder();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const supplierOptions = (suppliers ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }));
  const storeOptions = (stores ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }));
  const productOptions = (products ?? []).map((p) => ({
    label: `${p.name} (${p.sku})`,
    value: p.id,
  }));

  const statusOptions = [
    { label: t("filters.status_all"), value: "all" },
    { label: t("filters.status_pending"), value: "pending" },
    { label: t("filters.status_received"), value: "received" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (pos ?? []).filter((p) => {
      const matchSearch =
        p.id.includes(q) || (p.supplier?.name ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pos, search, statusFilter]);

  const pending = (pos ?? []).filter((p) => p.status === "pending").length;
  const totalVal = (pos ?? []).reduce(
    (s, p) => s + parseFloat(p.total ?? "0"),
    0,
  );

  const columns = [
    {
      key: "id",
      header: t("table.po_number"),
      render: (r: PurchaseOrder) => (
        <span
          className="font-mono text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "supplier",
      header: t("table.supplier"),
      render: (r: PurchaseOrder) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {r.supplier?.name ?? r.supplier_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "store",
      header: t("table.store"),
      render: (r: PurchaseOrder) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {r.store?.name ?? r.store_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "ordered_at",
      header: t("table.ordered"),
      render: (r: PurchaseOrder) => (
        <span className="text-xs">{formatDate(r.ordered_at)}</span>
      ),
    },
    {
      key: "expected_at",
      header: t("table.expected"),
      render: (r: PurchaseOrder) => (
        <span className="text-xs">{formatDate(r.expected_at)}</span>
      ),
    },
    {
      key: "total",
      header: t("table.total"),
      render: (r: PurchaseOrder) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.total as string))}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      render: (r: PurchaseOrder) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: t("table.actions"),
      render: (r: PurchaseOrder) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye size={14} />}
            onClick={() => {
              setDetailPO(r);
              setDetailOpen(true);
            }}
          >
            {t("buttons.view")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMut.isPending}
            onClick={() => deleteMut.mutate(r.id)}
          >
            {t("buttons.delete")}
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
          label={t("stats.total_orders")}
          value={pos?.length ?? 0}
          icon={<Truck size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label={t("stats.pending")}
          value={pending}
          icon={<Truck size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label={t("stats.total_value")}
          value={formatCurrency(totalVal)}
          icon={<Truck size={18} />}
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
            options={statusOptions}
            value={statusFilter}
            onChange={setStatus}
            className="w-36"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          {t("buttons.new_po")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("empty_state.title")}
          description={t("empty_state.description")}
          icon={<Truck size={28} />}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      {/* Create modal */}
      <CreatePOModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        supplierOptions={supplierOptions}
        storeOptions={storeOptions}
        productOptions={productOptions}
      />

      {/* Detail modal */}
      <PODetailModal
        po={detailPO}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailPO(null);
        }}
      />
    </div>
  );
}
