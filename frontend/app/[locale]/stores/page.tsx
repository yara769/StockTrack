"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Store } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useStores, useCreateStore, useUpdateStore, useDeleteStore } from "@/lib/api/hooks";
import type { Store as StoreType, CreateStoreDto } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function StoreModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Partial<StoreType> }) {
  const isEdit    = !!initial?.id;
  const createMut = useCreateStore();
  const updateMut = useUpdateStore();
  const [form, setForm] = useState<Partial<CreateStoreDto>>({
    name:     initial?.name     ?? "",
    code:     initial?.code     ?? "",
    address:  initial?.address  ?? "",
    phone:    initial?.phone    ?? "",
    timezone: initial?.timezone ?? "UTC",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = async () => {
    const dto: CreateStoreDto = { name: form.name!, code: form.code!, address: form.address, phone: form.phone, timezone: form.timezone };
    if (isEdit) await updateMut.mutateAsync({ id: initial!.id!, dto });
    else        await createMut.mutateAsync(dto);
    onClose();
  };
  const loading = createMut.isPending || updateMut.isPending;
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Store" : "New Store"} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Store Name *" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Code *" placeholder="STORE-01" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </div>
        <Input label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Timezone" placeholder="UTC" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{isEdit ? "Save Changes" : "Create Store"}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function StoresPage() {
  const { data: stores, isLoading } = useStores();
  const deleteMut = useDeleteStore();
  const [search, setSearch]     = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<StoreType | undefined>();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (stores ?? []).filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [stores, search]);

  const columns = [
    { key: "name", header: "Store", render: (r: StoreType) => (
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg text-xs font-bold" style={{ width: 34, height: 34, background: "var(--accent-muted)", color: "var(--accent)" }}>
          {r.code.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{r.name}</p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{r.code}</p>
        </div>
      </div>
    )},
    { key: "address", header: "Address", render: (r: StoreType) => <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.address ?? "—"}</span> },
    { key: "phone",   header: "Phone",   render: (r: StoreType) => <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.phone ?? "—"}</span> },
    { key: "timezone",header: "Timezone",render: (r: StoreType) => <Badge variant="muted">{r.timezone}</Badge> },
    { key: "status",  header: "Status",  render: (r: StoreType) => <Badge variant={r.is_active ? "success" : "muted"}>{r.is_active ? "Active" : "Inactive"}</Badge> },
    { key: "actions", header: "", render: (r: StoreType) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(r.id)}>Delete</Button>
      </div>
    )},
  ];

  return (
    <PageWrapper title="Stores" subtitle="Manage your store locations">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Input placeholder="Search stores…" icon={<Search size={14} />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button icon={<Plus size={16} />} onClick={() => { setEditing(undefined); setModalOpen(true); }}>New Store</Button>
        </div>
        {isLoading ? <SkeletonTable rows={4} cols={6} /> : filtered.length === 0
          ? <EmptyState title="No stores" description="Add your first store location." icon={<Store size={28} />} />
          : <Table columns={columns} data={filtered} keyField="id" />
        }
        <StoreModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(undefined); }} initial={editing} />
      </div>
    </PageWrapper>
  );
}
