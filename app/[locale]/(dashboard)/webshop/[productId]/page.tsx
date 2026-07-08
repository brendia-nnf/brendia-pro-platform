"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Card, Button } from "@/components/ui";
import {
  ProductGallery,
  ProductInfo,
  AddToCartButton,
  ProductGrid,
} from "@/components/webshop";
import { getProductById, mockProducts } from "@/lib/mock-data/products";
import { ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { productId } = use(params);
  const product = getProductById(productId);

  if (!product) {
    notFound();
  }

  // Get related products (same category, excluding current)
  const relatedProducts = mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

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
