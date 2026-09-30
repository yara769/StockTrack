"use client";

import { useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { useSales, useSaleItems, usePayments } from "@/lib/api/hooks";
import type { Sale } from "@/lib/api/types";
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// ── Sale detail modal ────────────────────────────────────────────────────────
function SaleDetailModal({
  sale,
  open,
  onClose,
}: {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: allItems }    = useSaleItems();
  const { data: allPayments } = usePayments();

  if (!sale) return null;

  const items    = (allItems    ?? []).filter((i) => i.sale_id === sale.id);
  const payments = (allPayments ?? []).filter((p) => p.sale_id === sale.id);

  return (
    <Modal open={open} onClose={onClose} title={`Sale #${sale.id.slice(0, 8).toUpperCase()}`} size="lg">
      <div className="space-y-5">
        {/* Meta row */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { label: "Date",     value: formatDateTime(sale.sold_at) },
            { label: "Customer", value: sale.customer?.name ?? "Walk-in" },
            { label: "Status",   value: <StatusBadge status={sale.status} /> },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-elevated)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>{label}</p>
              <div className="mt-0.5 font-medium" style={{ color: "var(--text-primary)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Items
          </p>
          <div
            className="rounded-xl overflow-hidden divide-y"
            style={{ border: "1px solid var(--border)" }}
          >
            {items.length === 0 && (
              <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                No item details available
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div>
                  <p style={{ color: "var(--text-primary)" }}>
                    {item.product?.name ?? item.product_id.slice(0, 8)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.qty} × {formatCurrency(parseFloat(item.unit_price as string))}
                  </p>
                </div>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(parseFloat(item.total as string))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          {[
            { label: "Subtotal",  value: formatCurrency(parseFloat(sale.subtotal)) },
            { label: "Tax",       value: formatCurrency(parseFloat(sale.tax)) },
            { label: "Discount",  value: `-${formatCurrency(parseFloat(sale.discount))}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
          <div
            className="flex justify-between font-bold text-base pt-2 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>Total</span>
            <span style={{ color: "var(--accent)" }}>
              {formatCurrency(parseFloat(sale.total))}
            </span>
          </div>
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Payments
            </p>
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center rounded-lg px-3 py-2 text-xs"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {p.method} — {formatDateTime(p.paid_at)}
                  </span>
                  <span className="font-semibold" style={{ color: "var(--accent)" }}>
                    {formatCurrency(parseFloat(p.amount as string))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function SalesHistory() {
  const { data: sales, isLoading } = useSales();
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Sale | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...(sales ?? [])]
      .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime())
      .filter(
        (s) =>
          s.id.includes(q) ||
          (s.customer?.name ?? "").toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q),
      );
  }, [sales, search]);

  const columns = [
    {
      key: "id",
      header: "Sale ID",
      render: (r: Sale) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "sold_at",
      header: "Date",
      render: (r: Sale) => (
        <span className="text-xs">{formatDateTime(r.sold_at)}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (r: Sale) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {r.customer?.name ?? "Walk-in"}
        </span>
      ),
    },
    {
      key: "cashier",
      header: "Cashier",
      render: (r: Sale) => (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {r.cashier?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (r: Sale) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.total))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Sale) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (r: Sale) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye size={14} />}
          onClick={() => { setSelected(r); setDetailOpen(true); }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by ID, customer, or status…"
          icon={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} records
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={7} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No sales found" description="Transactions will appear here once sales are made." />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <SaleDetailModal
        sale={selected}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      />
    </div>
  );
}
