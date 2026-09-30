"use client";

import { useTranslations } from "next-intl";
import { useSales } from "@/lib/api/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Sale } from "@/lib/api/types";

export function RecentTransactions() {
  const t = useTranslations("RecentTransactions");
  const { data: sales, isLoading } = useSales();

  const recent = [...(sales ?? [])]
    .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime())
    .slice(0, 10);

  const columns = [
    {
      key: "id",
      header: t("table.saleId"),
      render: (r: Sale) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {r.id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "sold_at",
      header: t("table.date"),
      render: (r: Sale) => (
        <span className="text-xs">{formatDateTime(r.sold_at)}</span>
      ),
    },
    {
      key: "customer",
      header: t("table.customer"),
      render: (r: Sale) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {r.customer?.name ?? t("table.walkIn")}
        </span>
      ),
    },
    {
      key: "total",
      header: t("table.total"),
      render: (r: Sale) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {formatCurrency(parseFloat(r.total))}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      render: (r: Sale) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("subtitle")}
        </span>
      </CardHeader>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <Table columns={columns} data={recent} keyField="id" />
      )}
    </Card>
  );
}