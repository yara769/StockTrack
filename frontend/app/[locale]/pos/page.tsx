"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import * as Tabs from "@radix-ui/react-tabs";
import { POSCheckout } from "@/components/pos/POSCheckout";
import { SalesHistory } from "@/components/pos/SalesHistory";

export default function POSPage() {
  const [tab, setTab] = useState("checkout");

  return (
    <PageWrapper title="Sales & POS" subtitle="Process transactions and review sales history">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List
          className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {(["checkout", "history"] as const).map((t) => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all outline-none"
              style={{
                background: tab === t ? "var(--accent)" : "transparent",
                color:      tab === t ? "#fff"          : "var(--text-secondary)",
              }}
            >
              {t === "checkout" ? "New Sale" : "Sales History"}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="checkout">
          <POSCheckout />
        </Tabs.Content>
        <Tabs.Content value="history">
          <SalesHistory />
        </Tabs.Content>
      </Tabs.Root>
    </PageWrapper>
  );
}
