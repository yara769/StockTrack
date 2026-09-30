"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCustomers,
  useSales,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/lib/api/hooks";
import type { Customer, CreateCustomerDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { formatCurrency } from "@/lib/utils";

// ── Create / Edit modal ──────────────────────────────────────────────────────
interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Customer>;
}

function CustomerModal({ open, onClose, initial }: CustomerModalProps) {
  const t = useTranslations("customers");
  const isEdit = !!initial?.id;
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();

  const [form, setForm] = useState<Partial<CreateCustomerDto>>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    loyalty_points: initial?.loyalty_points ?? 0,
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const dto: CreateCustomerDto = {
      name: form.name!,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      loyalty_points: Number(form.loyalty_points),
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
      title={isEdit ? t("modals.edit_title") : t("modals.new_title")}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label={t("modals.name_label")}
          placeholder={t("modals.name_placeholder")}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("modals.phone_label")}
            placeholder={t("modals.phone_placeholder")}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Input
            label={t("modals.email_label")}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <Input
          label={t("modals.address_label")}
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
        <Input
          label={t("modals.loyalty_points_label")}
          type="number"
          min={0}
          value={form.loyalty_points}
          onChange={(e) =>
            set("loyalty_points", Math.max(0, Number(e.target.value)))
          }
        />
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("buttons.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? t("buttons.save_changes") : t("buttons.add_customer")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function CustomersTab() {
  const t = useTranslations("customers");
  const { data: customers, isLoading } = useCustomers();
  const { data: sales } = useSales();
  const deleteMut = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();

  // Build spend map per customer
  const spendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales ?? []) {
      if (s.cust_id) {
        map.set(
          s.cust_id,
          (map.get(s.cust_id) ?? 0) + parseFloat(s.total ?? "0"),
        );
      }
    }
    return map;
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (customers ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const topSpender = useMemo(() => {
    if (!customers?.length) return 0;
    return Math.max(...(customers ?? []).map((c) => spendMap.get(c.id) ?? 0));
  }, [customers, spendMap]);

  const totalPoints = (customers ?? []).reduce(
    (s, c) => s + c.loyalty_points,
    0,
  );

  const columns = [
    {
      key: "name",
      header: t("table.customer"),
      render: (r: Customer) => (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
            style={{
              width: 34,
              height: 34,
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              {r.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {r.email ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: t("table.phone"),
      render: (r: Customer) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {r.phone ?? "—"}
        </span>
      ),
    },
    {
      key: "loyalty_points",
      header: t("table.points"),
      render: (r: Customer) => (
        <div className="flex items-center gap-1.5">
          <Star size={12} style={{ color: "var(--amber)" }} />
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--amber)" }}
          >
            {r.loyalty_points.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: "spend",
      header: t("table.total_spent"),
      render: (r: Customer) => {
        const spend = spendMap.get(r.id) ?? 0;
        return (
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {formatCurrency(spend)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("table.status"),
      render: (r: Customer) => (
        <Badge variant={r.is_active ? "success" : "muted"}>
          {r.is_active ? t("table.status_active") : t("table.status_inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: Customer) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(r);
              setModalOpen(true);
            }}
          >
            {t("buttons.edit")}
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
          label={t("stats.total_customers")}
          value={customers?.length ?? 0}
          icon={<Users size={18} />}
          accentColor="var(--accent)"
        />
        <StatTile
          label={t("stats.loyalty_points")}
          value={totalPoints.toLocaleString()}
          icon={<Star size={18} />}
          accentColor="var(--amber)"
        />
        <StatTile
          label={t("stats.top_spender")}
          value={formatCurrency(topSpender)}
          icon={<Users size={18} />}
          accentColor="#a78bfa"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder={t("filters.search_placeholder")}
          icon={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          {t("buttons.new_customer")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("empty_state.title")}
          description={t("empty_state.description")}
          icon={<Users size={28} />}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <CustomerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        initial={editing}
      />
    </div>
  );
}
