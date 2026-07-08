"use client";

import { Container } from "@/components/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Novi proizvod
        </h1>
        <p className="text-gray-600 mt-1">
          Dodajte novi proizvod u webshop.
        </p>
      </div>

      <ProductForm />
    </Container>
  );
}
