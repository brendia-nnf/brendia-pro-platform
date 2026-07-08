"use client";

import { Container } from "@/components/ui";
import { CouponTable } from "@/components/admin";

export default function AdminCouponsPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Kuponi
        </h1>
        <p className="text-gray-600 mt-1">
          Upravljajte promotivnim kodovima i popustima.
        </p>
      </div>

      <CouponTable />
    </Container>
  );
}
