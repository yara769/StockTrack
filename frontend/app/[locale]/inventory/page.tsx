"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import * as Tabs from "@radix-ui/react-tabs";
import { InventoryTab } from "@/components/inventory/InventoryTab";
import { ProductsTab } from "@/components/inventory/ProductsTab";

export default function InventoryPage() {
  const [tab, setTab] = useState("inventory");

  return (
    <PageWrapper title="Inventory & Products" subtitle="Manage stock levels and product catalog">
      <Tabs.Root value={tab} onValueChange={setTab}>
        {/* Tab bar */}
        <Tabs.List
          className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {(["inventory", "products"] as const).map((t) => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all outline-none"
              style={{
                background: tab === t ? "var(--accent)" : "transparent",
                color:      tab === t ? "#fff"          : "var(--text-secondary)",
              }}
            >
              {t}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="inventory">
          <InventoryTab />
        </Tabs.Content>
        <Tabs.Content value="products">
          <ProductsTab />
        </Tabs.Content>
      </Tabs.Root>
    </PageWrapper>
  );
}
