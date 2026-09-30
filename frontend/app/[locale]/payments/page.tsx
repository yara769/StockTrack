"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { PaymentsTab } from "@/components/returns/PaymentsTab";

export default function PaymentsPage() {
  return (
    <PageWrapper title="Payments" subtitle="All payment records across every sale">
      <PaymentsTab />
    </PageWrapper>
  );
}
