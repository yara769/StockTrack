"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { TopProducts } from "@/components/dashboard/TopProducts";

export default function DashboardPage() {
  return (
    <PageWrapper title="Dashboard" subtitle="Overview of your store performance">
      <div className="space-y-6">
        {/* KPI tiles row */}
        <DashboardKPIs />

        {/* Chart + Stock alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <StockAlerts />
        </div>

        {/* Recent transactions + Top products */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentTransactions />
          </div>
          <TopProducts />
        </div>
      </div>
    </PageWrapper>
  );
}
