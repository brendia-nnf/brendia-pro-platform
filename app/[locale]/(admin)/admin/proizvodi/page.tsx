"use client";

import { Container } from "@/components/ui";
import { ProductsTable } from "@/components/admin";

export default function AdminProductsPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Proizvodi
        </h1>
        <p className="text-gray-600 mt-1">
          Upravljajte proizvodima u webshopu.
        </p>
      </div>

      <ProductsTable />
    </Container>
  );
}
