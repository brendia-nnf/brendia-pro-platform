"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { QuantitySelector } from "./QuantitySelector";
import { useCart } from "@/providers/CartProvider";
import { ShoppingCart, Check } from "lucide-react";
import type { Product } from "@/lib/types/webshop";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, quantity);
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
          max={product.stockQuantity}
        />
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!product.inStock}
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

      {/* Shipping info */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        <p>Besplatna dostava za narudžbe iznad 100 €</p>
      </div>
    </div>
  );
}
