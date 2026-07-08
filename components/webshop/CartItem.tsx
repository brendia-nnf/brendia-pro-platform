"use client";

import Image from "next/image";
import Link from "next/link";
import { QuantitySelector } from "./QuantitySelector";
import { useCart } from "@/providers/CartProvider";
import { Trash2, Package } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/types/webshop";

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

export function CartItem({ item, compact = false }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const subtotal = product.price * quantity;

  if (compact) {
    return (
      <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="w-16 h-16 relative bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/webshop/${product.id}`}
            className="font-medium text-primary hover:text-secondary transition-colors line-clamp-1 text-sm"
          >
            {product.name}
          </Link>
          <p className="text-xs text-gray-500">Količina: {quantity}</p>
          <p className="text-sm font-medium text-primary mt-1">
            {formatPrice(subtotal)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100">
      {/* Image */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 relative bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Link
          href={`/webshop/${product.id}`}
          className="font-medium text-primary hover:text-secondary transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          {formatPrice(product.price)} / kom
        </p>

        <div className="flex items-center justify-between mt-auto pt-3">
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={(newQuantity) =>
              updateQuantity(product.id, newQuantity)
            }
            max={product.stockQuantity}
            size="sm"
          />

          <div className="flex items-center gap-4">
            <span className="font-semibold text-primary">
              {formatPrice(subtotal)}
            </span>
            <button
              onClick={() => removeFromCart(product.id)}
              className="p-2 text-gray-400 hover:text-error transition-colors"
              aria-label="Ukloni iz košarice"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
