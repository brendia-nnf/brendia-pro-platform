"use client";

import { useState, useMemo } from "react";
import { Container } from "@/components/ui";
import { ProductGrid, ProductFilters } from "@/components/webshop";
import { mockProducts } from "@/lib/mock-data/products";
import { useTranslations } from "next-intl";
import type { ProductCategory } from "@/lib/types/webshop";
import { ShoppingBag } from "lucide-react";

type FilterCategory = ProductCategory | "all";

export default function WebshopPage() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const t = useTranslations("webshop");
  const tCommon = useTranslations("common");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return mockProducts;
    }
    return mockProducts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Container size="xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-secondary" />
              </div>
              <h1 className="text-3xl font-heading font-semibold text-primary">
                {t("title")}
              </h1>
            </div>
            <p className="text-gray-600">
              {t("subtitle")}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? tCommon("product") : tCommon("products")}
          </p>
        </div>

        {/* Filters */}
        <ProductFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Products grid */}
        <ProductGrid products={filteredProducts} />

        {/* Info banner */}
        <div className="bg-cream rounded-xl p-6 text-center">
          <h3 className="font-medium text-primary mb-2">
            {t("freeShipping")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("deliveryTime")}
          </p>
        </div>
      </div>
    </Container>
  );
}
