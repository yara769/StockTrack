"use client";

import { useState, useMemo } from "react";
import { Plus, Search, AlertTriangle, Package, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useInventory,
  useStores,
  useProducts,
  useCreateInventory,
  useUpdateInventory,
  useDeleteInventory,
} from "@/lib/api/hooks";
import type { InventoryItem, CreateInventoryDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";

// ── Stock level badge helper ─────────────────────────────────────────────────
function StockBadge({ qty, min }: { qty: number; min: number }) {
  const t = useTranslations("Inventory.badges");

  if (qty === 0) return <Badge variant="danger">{t("outOfStock")}</Badge>;
  if (qty <= min) return <Badge variant="warning">{t("lowStock")}</Badge>;
  return <Badge variant="success">{t("inStock")}</Badge>;
}

// ── Edit/Create modal ────────────────────────────────────────────────────────
interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<InventoryItem>;
  storeOptions: { label: string; value: string }[];
  productOptions: { label: string; value: string }[];
}

function InventoryModal({
  open,
  onClose,
  initial,
  storeOptions,
  productOptions,
}: InventoryModalProps) {
  const t = useTranslations("Inventory.modal");
  const isEdit = !!initial?.id;
  const createMut = useCreateInventory();
  const updateMut = useUpdateInventory();

  const [form, setForm] = useState<Partial<CreateInventoryDto>>({
    store_id: initial?.store_id ?? "",
    product_id: initial?.product_id ?? "",
    quantity: initial?.quantity ?? 0,
    min_stock: initial?.min_stock ?? 0,
    max_stock: initial?.max_stock ?? 0,
    location: initial?.location ?? "",
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const dto: CreateInventoryDto = {
      store_id: form.store_id!,
      product_id: form.product_id!,
      quantity: Number(form.quantity),
      min_stock: Number(form.min_stock),
      max_stock: Number(form.max_stock),
      location: form.location || undefined,
    };
    if (isEdit) {
      await updateMut.mutateAsync({ id: initial!.id!, dto });
    } else {
      await createMut.mutateAsync(dto);
    }
    onClose();
  };

  const loading = createMut.isPending || updateMut.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("editTitle") : t("addTitle")}
      size="md"
    >
      <div className="space-y-4">
        <Select
          label={t("storeLabel")}
          options={storeOptions}
          value={form.store_id}
          onChange={(v) => set("store_id", v)}
        />
        <Select
          label={t("productLabel")}
          options={productOptions}
          value={form.product_id}
          onChange={(v) => set("product_id", v)}
        />
        <div className="grid grid-cols-3 gap-3">
          <Input
            label={t("quantityLabel")}
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) =>
              set("quantity", Math.max(0, Number(e.target.value)))
            }
          />
          <Input
            label={t("minStockLabel")}
            type="number"
            min={0}
            value={form.min_stock}
            onChange={(e) =>
              set("min_stock", Math.max(0, Number(e.target.value)))
            }
          />
          <Input
            label={t("maxStockLabel")}
            type="number"
            min={0}
            value={form.max_stock}
            onChange={(e) =>
              set("max_stock", Math.max(0, Number(e.target.value)))
            }
          />
        </div>
        <Input
          label={t("locationLabel")}
          placeholder={t("locationPlaceholder")}
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
        />
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? t("saveChanges") : t("addRecord")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main tab component ───────────────────────────────────────────────────────
export function InventoryTab() {
  const t = useTranslations("Inventory");
  const { data: inventory, isLoading } = useInventory();
  const { data: stores } = useStores();
  const { data: products } = useProducts();
  const deleteMut = useDeleteInventory();

  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | undefined>();

  const storeOptions = [
    { label: t("toolbar.allStores"), value: "all" },
    ...(stores ?? []).map((s) => ({ label: s.name, value: s.id })),
  ];
  const productOptions = (products ?? []).map((p) => ({
    label: `${p.name} (${p.sku})`,
    value: p.id,
  }));
  const storeSelectOpts = (stores ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const filtered = useMemo(() => {
    return (inventory ?? []).filter((i) => {
      const pName = i.product?.name ?? "";
      const matchSearch =
        pName.toLowerCase().includes(search.toLowerCase()) ||
        i.product_id.includes(search);
      const matchStore = filterStore === "all" || i.store_id === filterStore;
      return matchSearch && matchStore;
    });
  }, [inventory, search, filterStore]);

  const lowStockCount = (inventory ?? []).filter(
    (i) => i.quantity <= i.min_stock,
  ).length;
  const outOfStock = (inventory ?? []).filter((i) => i.quantity === 0).length;

  const columns = [
    {
      key: "product",
      header: t("table.product"),
      render: (r: InventoryItem) => (
        <div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            {r.product?.name ?? r.product_id.slice(0, 8)}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {r.product?.sku}
          </p>
        </div>
      ),
    },
    {
      key: "store",
      header: t("table.store"),
      render: (r: InventoryItem) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {r.store?.name ?? r.store_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "quantity",
      header: t("table.qty"),
      render: (r: InventoryItem) => (
        <span
          className="font-semibold text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          {r.quantity}
        </span>
      ),
    },
    {
      key: "min_stock",
      header: t("table.minMax"),
      render: (r: InventoryItem) => (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {r.min_stock} / {r.max_stock}
        </span>
      ),
    },
    {
      key: "location",
      header: t("table.location"),
      render: (r: InventoryItem) => (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {r.location ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      render: (r: InventoryItem) => (
        <StockBadge qty={r.quantity} min={r.min_stock} />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: InventoryItem) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(r);
              setModalOpen(true);
            }}
          >
            {t("table.edit")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMut.isPending}
            onClick={() => deleteMut.mutate(r.id)}
          >
            {t("table.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label={t("stats.totalSkus")}
          value={inventory?.length ?? 0}
          icon={<Package size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label={t("stats.lowStock")}
          value={lowStockCount}
          icon={<AlertTriangle size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label={t("stats.outOfStock")}
          value={outOfStock}
          icon={<AlertTriangle size={18} />}
          accentColor="var(--danger)"
        />
        <StatTile
          label={t("stats.locations")}
          value={(inventory ?? []).filter((i) => i.location).length}
          icon={<Warehouse size={18} />}
          accentColor="#a78bfa"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder={t("toolbar.searchPlaceholder")}
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select
            options={storeOptions}
            value={filterStore}
            onChange={setFilterStore}
            className="w-44"
          />
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          {t("toolbar.addRecord")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      {/* Modal */}
      <InventoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        initial={editing}
        storeOptions={storeSelectOpts}
        productOptions={productOptions}
      />
    </div>
  );
}
