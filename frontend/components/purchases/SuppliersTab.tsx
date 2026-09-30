"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/lib/api/hooks";
import type { Supplier, CreateSupplierDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Create / Edit modal ──────────────────────────────────────────────────────
interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Supplier>;
}

function SupplierModal({ open, onClose, initial }: SupplierModalProps) {
  const isEdit    = !!initial?.id;
  const createMut = useCreateSupplier();
  const updateMut = useUpdateSupplier();

  const [form, setForm] = useState<Partial<CreateSupplierDto>>({
    name:           initial?.name            ?? "",
    contact_person: initial?.contact_person  ?? "",
    phone:          initial?.phone           ?? "",
    email:          initial?.email           ?? "",
    address:        initial?.address         ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const dto: CreateSupplierDto = {
      name:           form.name!,
      contact_person: form.contact_person || undefined,
      phone:          form.phone          || undefined,
      email:          form.email          || undefined,
      address:        form.address        || undefined,
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
      title={isEdit ? "Edit Supplier" : "New Supplier"}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Company Name *"
          placeholder="Supplier Inc."
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Input
          label="Contact Person"
          placeholder="John Doe"
          value={form.contact_person}
          onChange={(e) => set("contact_person", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone"
            placeholder="+966 5x xxx xxxx"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="contact@supplier.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <Input
          label="Address"
          placeholder="Street, City, Country"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? "Save Changes" : "Add Supplier"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function SuppliersTab() {
  const { data: suppliers, isLoading } = useSuppliers();
  const deleteMut = useDeleteSupplier();

  const [search, setSearch]   = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Supplier | undefined>();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (suppliers ?? []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_person ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const columns = [
    {
      key: "name",
      header: "Supplier",
      render: (r: Supplier) => (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg text-xs font-bold shrink-0"
            style={{
              width: 36, height: 36,
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{r.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {r.contact_person ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (r: Supplier) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {r.phone ?? "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (r: Supplier) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {r.email ?? "—"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (r: Supplier) => (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {r.address ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Supplier) => (
        <Badge variant={r.is_active ? "success" : "muted"}>
          {r.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: Supplier) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditing(r); setModalOpen(true); }}
          >
            Edit
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
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search suppliers…"
          icon={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button
          icon={<Plus size={16} />}
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
        >
          New Supplier
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          description="Add your first supplier to start creating purchase orders."
          icon={<Building2 size={28} />}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <SupplierModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(undefined); }}
        initial={editing}
      />
    </div>
  );
}
