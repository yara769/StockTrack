"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSales, usePayments, useReturns } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const { data: sales }    = useSales();
  const { data: payments } = usePayments();
  const { data: returns }  = useReturns();

  // Monthly revenue
  const monthlyData = (() => {
    const map = new Map<string, number>();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleDateString("en-SA", { month: "short", year: "2-digit" });
    });
    months.forEach((m) => map.set(m, 0));
    (sales ?? []).forEach((s) => {
      const key = new Date(s.sold_at).toLocaleDateString("en-SA", { month: "short", year: "2-digit" });
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + parseFloat(s.total ?? "0"));
    });
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
  })();

  const totalRevenue  = (sales ?? []).reduce((s, x) => s + parseFloat(x.total ?? "0"), 0);
  const totalPayments = (payments ?? []).reduce((s, x) => s + parseFloat(x.amount as string ?? "0"), 0);
  const totalRefunds  = (returns ?? []).reduce((s, x) => s + parseFloat(x.refund_amount as string ?? "0"), 0);

  return (
    <PageWrapper title="Reports" subtitle="Business performance overview">
      <div className="space-y-6">
        {/* KPI summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Revenue",  value: formatCurrency(totalRevenue),  color: "var(--accent)" },
            { label: "Total Collected",value: formatCurrency(totalPayments), color: "#a78bfa" },
            { label: "Total Refunds",  value: formatCurrency(totalRefunds),  color: "var(--danger)" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <TopProducts />
        </div>

        {/* Monthly bar */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-accent)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--text-secondary)" }}
                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </PageWrapper>
  );
}
