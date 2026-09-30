"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import * as Tabs from "@radix-ui/react-tabs";
import { ReturnsTab } from "@/components/returns/ReturnsTab";
import { PaymentsTab } from "@/components/returns/PaymentsTab";
import { CustomersTab } from "@/components/returns/CustomersTab";

export default function ReturnsPage() {
  const [tab, setTab] = useState("returns");

  return (
    <PageWrapper title="Returns & Payments" subtitle="Process returns, track payments and customer balances">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List
          className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {[
            { value: "returns",   label: "Returns" },
            { value: "payments",  label: "Payments" },
            { value: "customers", label: "Customers" },
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

        <Tabs.Content value="returns">
          <ReturnsTab />
        </Tabs.Content>
        <Tabs.Content value="payments">
          <PaymentsTab />
        </Tabs.Content>
        <Tabs.Content value="customers">
          <CustomersTab />
        </Tabs.Content>
      </Tabs.Root>
    </PageWrapper>
  );
}
