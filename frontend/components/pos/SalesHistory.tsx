"use client";

import { useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("SalesHistory");
  const { data: allItems } = useSaleItems();
  const { data: allPayments } = usePayments();

  if (!sale) return null;

  const items = (allItems ?? []).filter((i) => i.sale_id === sale.id);
  const payments = (allPayments ?? []).filter((p) => p.sale_id === sale.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modalTitle", { id: sale.id.slice(0, 8).toUpperCase() })}
      size="lg"
    >
      <div className="space-y-5">
        {/* Meta row */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { label: t("labels.date"), value: formatDateTime(sale.sold_at) },
            {
              label: t("labels.customer"),
              value: sale.customer?.name ?? t("defaults.walkIn"),
            },
            {
              label: t("labels.status"),
              value: <StatusBadge status={sale.status} />,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-elevated)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>{label}</p>
              <div
                className="mt-0.5 font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("labels.items")}
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
                {t("defaults.noItems")}
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
                    {item.qty} ×{" "}
                    {formatCurrency(parseFloat(item.unit_price as string))}
                  </p>
                </div>
                <span
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatCurrency(parseFloat(item.total as string))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          {[
            {
              label: t("labels.subtotal"),
              value: formatCurrency(parseFloat(sale.subtotal ?? "0")),
            },
            {
              label: t("labels.tax"),
              value: formatCurrency(parseFloat(sale.tax ?? "0")),
            },
            {
              label: t("labels.discount"),
              value: `-${formatCurrency(parseFloat(sale.discount ?? "0"))}`,
            },
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
            <span style={{ color: "var(--text-primary)" }}>
              {t("labels.total")}
            </span>
            <span style={{ color: "var(--accent)" }}>
              {formatCurrency(parseFloat(sale.total ?? "0"))}
            </span>
          </div>
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("labels.payments")}
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
                  <span
                    className="font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
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
  const t = useTranslations("SalesHistory");
  const { data: sales, isLoading } = useSales();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...(sales ?? [])]
      .sort(
        (a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime(),
      )
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          (s.customer?.name ?? "").toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q),
      );
  }, [sales, search]);

  const columns = [
    {
      key: "id",
      header: t("columns.saleId"),
      render: (r: Sale) => (
        <span
          className="font-mono text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "sold_at",
      header: t("columns.date"),
      render: (r: Sale) => (
        <span className="text-xs">{formatDateTime(r.sold_at)}</span>
      ),
    },
    {
      key: "customer",
      header: t("columns.customer"),
      render: (r: Sale) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {r.customer?.name ?? t("defaults.walkIn")}
        </span>
      ),
    },
    {
      key: "cashier",
      header: t("columns.cashier"),
      render: (r: Sale) => (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {r.cashier?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: t("columns.total"),
      render: (r: Sale) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.total))}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
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
          onClick={() => {
            setSelected(r);
            setDetailOpen(true);
          }}
        >
          {t("actions.view")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={t("searchPlaceholder")}
          icon={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("recordsCount", { count: filtered.length })}
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={7} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("emptyState.title")}
          description={t("emptyState.description")}
        />
      ) : (
        <Table columns={columns} data={filtered} keyField="id" />
      )}

      <SaleDetailModal
        sale={selected}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
