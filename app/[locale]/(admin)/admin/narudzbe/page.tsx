"use client";

import { Container } from "@/components/ui";
import { OrdersTable } from "@/components/admin";

export default function AdminOrdersPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Narudžbe
        </h1>
        <p className="text-gray-600 mt-1">
          Pregledajte i upravljajte narudžbama iz webshopa.
        </p>
      </div>

      <OrdersTable />
    </Container>
  );
}
