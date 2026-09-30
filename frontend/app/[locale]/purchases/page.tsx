"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import * as Tabs from "@radix-ui/react-tabs";
import { PurchaseOrdersTab } from "@/components/purchases/PurchaseOrdersTab";
import { SuppliersTab } from "@/components/purchases/SuppliersTab";

export default function PurchasesPage() {
  const [tab, setTab] = useState("orders");

  return (
    <PageWrapper title="Purchases & Suppliers" subtitle="Manage purchase orders and supplier records">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List
          className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {[
            { value: "orders",    label: "Purchase Orders" },
            { value: "suppliers", label: "Suppliers" },
          ].map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all outline-none"
              style={{
                background: tab === t.value ? "var(--accent)" : "transparent",
                color:      tab === t.value ? "#fff"           : "var(--text-secondary)",
              }}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="orders">
          <PurchaseOrdersTab />
        </Tabs.Content>
        <Tabs.Content value="suppliers">
          <SuppliersTab />
        </Tabs.Content>
      </Tabs.Root>
    </PageWrapper>
  );
}
