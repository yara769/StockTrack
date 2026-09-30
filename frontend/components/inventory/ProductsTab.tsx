"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/api/hooks";
import type { Product, CreateProductDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

// ── Create / Edit modal ──────────────────────────────────────────────────────
interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Product>;
  categoryOptions: { label: string; value: string }[];
}

function ProductModal({
  open,
  onClose,
  initial,
  categoryOptions,
}: ProductModalProps) {
  const t = useTranslations("Products.modal");
  const isEdit = !!initial?.id;
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  const [form, setForm] = useState<Partial<CreateProductDto>>({
    cat_id: initial?.cat_id ?? "",
    sku: initial?.sku ?? "",
    barcode: initial?.barcode ?? "",
    name: initial?.name ?? "",
    price: initial?.price ? parseFloat(initial.price as string) : 0,
    unit: initial?.unit ?? "piece",
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const dto: CreateProductDto = {
      cat_id: form.cat_id!,
      sku: form.sku!,
      barcode: form.barcode || undefined,
      name: form.name!,
      price: Number(form.price),
      unit: form.unit || "piece",
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
          label={t("categoryLabel")}
          options={categoryOptions}
          value={form.cat_id}
          onChange={(v) => set("cat_id", v)}
        />
        <Input
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("skuLabel")}
            placeholder={t("skuPlaceholder")}
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
          />
          <Input
            label={t("barcodeLabel")}
            placeholder={t("barcodePlaceholder")}
            value={form.barcode}
            onChange={(e) => set("barcode", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("priceLabel")}
            type="number"
            placeholder={t("pricePlaceholder")}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
          <Input
            label={t("unitLabel")}
            placeholder={t("unitPlaceholder")}
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? t("saveChanges") : t("createProduct")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function ProductsTab() {
  const t = useTranslations("Products");
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const deleteMut = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  const catOptions = [
    { label: t("toolbar.allCategories"), value: "all" },
    ...(categories ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];
  const catSelectOpts = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.cat_id === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const columns = [
    {
      key: "name",
      header: t("table.product"),
      render: (r: Product) => (
        <div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            {r.name}
          </p>
          <p
            className="text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {r.sku}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: t("table.category"),
      render: (r: Product) => (
        <Badge variant="muted">{r.category?.name ?? "—"}</Badge>
      ),
    },
    {
      key: "price",
      header: t("table.price"),
      render: (r: Product) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.price as string))}
        </span>
      ),
    },
    {
      key: "unit",
      header: t("table.unit"),
      render: (r: Product) => (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {r.unit}
        </span>
      ),
    },
    {
      key: "barcode",
      header: t("table.barcode"),
      render: (r: Product) => (
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {r.barcode ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      render: (r: Product) => (
        <Badge variant={r.is_active ? "success" : "muted"}>
          {r.is_active ? t("table.active") : t("table.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: Product) => (
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder={t("toolbar.searchPlaceholder")}
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select
            options={catOptions}
            value={catFilter}
            onChange={setCatFilter}
            className="w-48"
          />
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          {t("toolbar.newProduct")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={7} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      {/* Modal */}
      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        initial={editing}
        categoryOptions={catSelectOpts}
      />
    </div>
  );
}
