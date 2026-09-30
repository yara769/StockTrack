"use client";

import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatTile } from "@/components/ui/StatTile";
import { useSales } from "@/lib/api/hooks";
import { useCustomers } from "@/lib/api/hooks";
import { useInventory } from "@/lib/api/hooks";
import { useProducts } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/utils";

export function DashboardKPIs() {
  const t = useTranslations("DashboardKPIs");

  const { data: sales, isLoading: loadingSales } = useSales();
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: inventory, isLoading: loadingInventory } = useInventory();
  const { data: products, isLoading: loadingProducts } = useProducts();

  const totalRevenue = (sales ?? []).reduce(
    (sum, s) => sum + parseFloat(s.total ?? "0"),
    0,
  );

  const todayRevenue = (sales ?? [])
    .filter((s) => {
      const d = new Date(s.sold_at);
      const t = new Date();
      return (
        d.getDate() === t.getDate() &&
        d.getMonth() === t.getMonth() &&
        d.getFullYear() === t.getFullYear()
      );
    })
    .reduce((sum, s) => sum + parseFloat(s.total ?? "0"), 0);

  const lowStockCount = (inventory ?? []).filter(
    (i) => i.quantity <= i.min_stock,
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatTile
        label={t("totalRevenue.label")}
        value={formatCurrency(totalRevenue)}
        sub={t("totalRevenue.sub", { amount: formatCurrency(todayRevenue) })}
        icon={<DollarSign size={20} />}
        trend={8}
        accentColor="var(--accent)"
        loading={loadingSales}
      />
      <StatTile
        label={t("totalSales.label")}
        value={(sales?.length ?? 0).toLocaleString()}
        sub={t("totalSales.sub")}
        icon={<ShoppingCart size={20} />}
        trend={5}
        accentColor="var(--amber)"
        loading={loadingSales}
      />
      <StatTile
        label={t("customers.label")}
        value={(customers?.length ?? 0).toLocaleString()}
        sub={t("customers.sub")}
        icon={<Users size={20} />}
        trend={2}
        accentColor="#a78bfa"
        loading={loadingCustomers}
      />
      <StatTile
        label={t("lowStock.label")}
        value={lowStockCount}
        sub={t("lowStock.sub", { count: products?.length ?? 0 })}
        icon={<Package size={20} />}
        trend={lowStockCount > 0 ? -lowStockCount : 0}
        accentColor="var(--danger)"
        loading={loadingInventory || loadingProducts}
      />
    </div>
  );
}
