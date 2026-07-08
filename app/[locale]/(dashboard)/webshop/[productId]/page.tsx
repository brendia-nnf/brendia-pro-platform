"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Card } from "@/components/ui";
import {
  ProductGallery,
  ProductInfo,
  AddToCartButton,
  ProductGrid,
} from "@/components/webshop";
import { ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import type { Product } from "@/lib/types/webshop";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { productId } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
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

        // Fetch related products
        const relatedResponse = await fetch(`/api/products?category=${data.product.category}`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedProducts(
            (relatedData.products || [])
              .filter((p: Product) => p.id !== productId)
              .slice(0, 4)
          );
        }
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
      <div className="space-y-12">
        {/* Breadcrumb */}
        <Link
          href="/webshop"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Natrag na webshop</span>
        </Link>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info and actions */}
          <div className="space-y-8">
            <ProductInfo product={product} />
            <AddToCartButton product={product} />

            {/* Trust badges */}
            <Card variant="outline" padding="md">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Truck className="h-6 w-6 mx-auto text-secondary" />
                  <p className="text-xs text-gray-600">Brza dostava</p>
                </div>
                <div className="space-y-2">
                  <Shield className="h-6 w-6 mx-auto text-secondary" />
                  <p className="text-xs text-gray-600">Sigurna kupnja</p>
                </div>
                <div className="space-y-2">
                  <RotateCcw className="h-6 w-6 mx-auto text-secondary" />
                  <p className="text-xs text-gray-600">14 dana povrat</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-heading font-semibold text-primary mb-6">
              Povezani proizvodi
            </h2>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </Container>
  );
}
