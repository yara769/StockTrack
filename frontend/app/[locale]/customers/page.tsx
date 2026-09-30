"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { CustomersTab } from "@/components/returns/CustomersTab";

export default function CustomersPage() {
  return (
    <PageWrapper title="Customers" subtitle="Customer records, loyalty points and purchase history">
      <CustomersTab />
    </PageWrapper>
  );
}
