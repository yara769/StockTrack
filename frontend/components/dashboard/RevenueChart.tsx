"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";
import { useSales } from "@/lib/api/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";

function buildChartData(
  sales: { sold_at: string; total: string }[],
  locale: string,
) {
  // Aggregate by day for the last 30 days
  const map = new Map<string, number>();

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
    map.set(key, 0);
  }

  for (const sale of sales) {
    const d = new Date(sale.sold_at);
    const key = d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + parseFloat(sale.total ?? "0"));
    }
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-accent)",
        color: "var(--text-primary)",
      }}
    >
      <p style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="font-semibold" style={{ color: "var(--accent)" }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export function RevenueChart() {
  const t = useTranslations("RevenueChart");
  const locale = useLocale();
  const { data: sales, isLoading } = useSales();

  if (isLoading) return <SkeletonCard />;

  const chartData = buildChartData(sales ?? [], locale);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <span className="text-xs" style={{ color: "var(--accent)" }}>
          {formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))}
        </span>
      </CardHeader>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#revGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "#10b981",
              stroke: "var(--bg-elevated)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
