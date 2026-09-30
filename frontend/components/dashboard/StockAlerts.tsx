"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInventory } from "@/lib/api/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

export function StockAlerts() {
  const t = useTranslations("StockAlerts");
  const { data: inventory, isLoading } = useInventory();

  if (isLoading) return <SkeletonCard />;

  const lowStock = (inventory ?? [])
    .filter((i) => i.quantity <= i.min_stock)
    .slice(0, 8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        {lowStock.length > 0 && (
          <Badge variant="danger">
            {t("itemsCount", { count: lowStock.length })}
          </Badge>
        )}
      </CardHeader>

      {lowStock.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.description")}
          icon={<AlertTriangle size={24} />}
        />
      ) : (
        <ul className="space-y-2">
          {lowStock.map((item, idx) => {
            const pct =
              item.max_stock > 0
                ? Math.max(
                    0,
                    Math.round((item.quantity / item.max_stock) * 100),
                  )
                : 0;
            const isOut = item.quantity === 0;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg px-3 py-2.5"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-medium truncate max-w-[140px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.product?.name ?? item.product_id}
                  </span>
                  <Badge variant={isOut ? "danger" : "warning"}>
                    {isOut
                      ? t("badge.out")
                      : t("badge.left", { count: item.quantity })}
                  </Badge>
                </div>
                {/* progress bar */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isOut ? "var(--danger)" : "var(--amber)",
                      width: `${pct}%`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  />
                </div>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("minMax", { min: item.min_stock, max: item.max_stock })}
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
