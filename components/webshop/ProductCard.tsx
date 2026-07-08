"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, Badge, Button } from "@/components/ui";
import { ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import type { Product } from "@/lib/types/webshop";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <Link href={`/webshop/${product.id}`}>
      <Card
        variant="outline"
        padding="none"
        className={cn(
          "group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col",
          className
        )}
      >
        {/* Image container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <Badge variant="error" size="sm">
                -{discount}%
              </Badge>
            )}
            {product.featured && (
              <Badge variant="secondary" size="sm">
                Istaknuto
              </Badge>
            )}
          </div>

          {/* Quick add button - shows on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Dodaj u košaricu
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-medium text-primary group-hover:text-secondary transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {!product.inStock && (
            <p className="text-sm text-error mt-2">Nema na skladištu</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
