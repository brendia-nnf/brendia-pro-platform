"use client";

import { Container } from "@/components/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types/webshop";

export default function NewProductPage() {
  const handleSave = (product: Product) => {
    // In a real app, this would call an API to create the product
    console.log("Creating product:", product);
    // The ProductForm handles navigation back to the list
  };

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

      <ProductForm onSave={handleSave} />
    </Container>
  );
}
