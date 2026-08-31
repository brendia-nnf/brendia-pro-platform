"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { QuantitySelector } from "./QuantitySelector";
import { useCart } from "@/providers/CartProvider";
import { ShoppingCart, Check } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types/webshop";

interface AddToCartButtonProps {
  product: Product;
  // For variant products: the chosen combination (undefined until picked)
  selectedVariant?: ProductVariant;
  // True while a variant product has no complete selection yet
  awaitingSelection?: boolean;
}

export function AddToCartButton({
  product,
  selectedVariant,
  awaitingSelection = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const hasVariants = product.hasVariants && (product.variants?.length || 0) > 0;
  const inStock = hasVariants
    ? selectedVariant?.inStock ?? false
    : product.inStock;
  const maxQuantity = hasVariants
    ? selectedVariant?.stockQuantity || 1
    : product.stockQuantity;
  const disabled = hasVariants ? !selectedVariant || !inStock : !inStock;

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) return;
    addToCart(product, quantity, selectedVariant);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-600">Količina:</span>
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          max={maxQuantity}
        />
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={disabled}
        size="lg"
        className="w-full"
        variant={isAdded ? "secondary" : "primary"}
      >
        {isAdded ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Dodano u košaricu
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Dodaj u košaricu
          </>
        )}
      </Button>

      {hasVariants && awaitingSelection && (
        <p className="text-sm text-center text-gray-500">
          Odaberite opcije kako biste dodali proizvod u košaricu.
        </p>
      )}
      {hasVariants && !awaitingSelection && !selectedVariant && (
        <p className="text-sm text-center text-error">
          Odabrana kombinacija nije dostupna.
        </p>
      )}

      {/* Shipping info */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        <p>Besplatna dostava za narudžbe iznad 100 €</p>
      </div>
    </div>
  );
}
