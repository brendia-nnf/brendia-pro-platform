"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ProductCategory } from "@/lib/types/webshop";

type FilterCategory = ProductCategory | "all";

interface ProductFiltersProps {
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
  className?: string;
}

export function ProductFilters({
  selectedCategory,
  onCategoryChange,
  className,
}: ProductFiltersProps) {
  const t = useTranslations("webshop");

  const categories: { value: FilterCategory; label: string }[] = [
    { value: "all", label: t("allProducts") },
    { value: "extensions", label: t("categories.extensions") },
    { value: "tools", label: t("categories.tools") },
    { value: "care", label: t("categories.care") },
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            selectedCategory === category.value
              ? "bg-secondary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
