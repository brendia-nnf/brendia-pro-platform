"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/mock-data/products";
import type { Product } from "@/lib/types/webshop";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = use(params);
  const product = getProductById(productId);

  if (!product) {
    notFound();
  }

  const handleSave = (updatedProduct: Product) => {
    // In a real app, this would call an API to update the product
    console.log("Updating product:", updatedProduct);
    // The ProductForm handles navigation back to the list
  };

  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Uredi proizvod
        </h1>
        <p className="text-gray-600 mt-1">
          {product.name}
        </p>
      </div>

      <ProductForm product={product} onSave={handleSave} />
    </Container>
  );
}
