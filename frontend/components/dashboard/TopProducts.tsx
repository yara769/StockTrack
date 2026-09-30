"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSaleItems, useProducts } from "@/lib/api/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function TopProducts() {
  const t = useTranslations("TopProducts");
  const { data: saleItems, isLoading: loadingItems } = useSaleItems();
  const { data: products, isLoading: loadingProducts } = useProducts();

  // Lookup map for fast product metadata access
  const productMap = useMemo(
    () => new Map((products ?? []).map((p) => [p.id, p])),
    [products],
  );

  // Aggregate and sort sales data by revenue
  const { sorted, maxRevenue } = useMemo(() => {
    const totals = new Map<string, { qty: number; revenue: number }>();

    for (const item of saleItems ?? []) {
      const prev = totals.get(item.product_id) ?? { qty: 0, revenue: 0 };
      const itemTotal =
        typeof item.total === "number"
          ? item.total
          : parseFloat(item.total ?? "0");

      totals.set(item.product_id, {
        qty: prev.qty + (item.qty || 0),
        revenue: prev.revenue + (isNaN(itemTotal) ? 0 : itemTotal),
      });
    }

    const sortedList = [...totals.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6);

    const max = sortedList[0]?.[1].revenue ?? 1;

    return { sorted: sortedList, maxRevenue: max };
  }, [saleItems]);

  if (loadingItems || loadingProducts) return <SkeletonCard />;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("title")}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {t("subtitle")}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-4">
          {sorted.length === 0 && (
            <p className="text-xs text-center py-6 text-muted-foreground">
              {t("empty")}
            </p>
          )}
          {sorted.map(([productId, stats], idx) => {
            const product = productMap.get(productId);
            const pct = Math.min(
              100,
              Math.round((stats.revenue / maxRevenue) * 100),
            );

            return (
              <motion.li
                key={productId}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium truncate max-w-[160px] text-foreground">
                    {product?.name ?? productId.slice(0, 8)}
                  </span>
                  <span className="font-semibold text-accent">
                    {formatCurrency(stats.revenue)}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full overflow-hidden bg-border/50">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: idx * 0.05,
                      ease: "easeOut",
                    }}
                  />
                </div>

                <p className="text-[10px] mt-1 text-muted-foreground">
                  {t("unitsSold", { count: stats.qty })}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
