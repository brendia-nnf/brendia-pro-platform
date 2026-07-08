"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types/webshop";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("not_found");
          } else {
            setError("Failed to load product");
          }
          return;
        }
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      </Container>
    );
  }

  if (error === "not_found" || !product) {
    notFound();
  }

  if (error) {
    return (
      <Container size="xl">
        <div className="text-center py-12 text-red-500">{error}</div>
      </Container>
    );
  }

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

      <ProductForm product={product} />
    </Container>
  );
}
