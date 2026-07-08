"use client";

import { Badge } from "@/components/ui";
import { CATEGORY_LABELS, type Product } from "@/lib/types/webshop";
import { Check, X } from "lucide-react";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Category badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">{CATEGORY_LABELS[product.category]}</Badge>
        {product.featured && <Badge variant="secondary">Istaknuto</Badge>}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-heading font-semibold text-primary">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-primary">
          {formatPrice(product.price)}
        </span>
        {product.originalPrice && (
          <>
            <span className="text-xl text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
            <Badge variant="error" size="sm">
              -{discount}%
            </Badge>
          </>
        )}
      </div>

      {/* Stock status */}
      <div className="flex items-center gap-2">
        {product.inStock ? (
          <>
            <Check className="h-5 w-5 text-success" />
            <span className="text-success font-medium">Na skladištu</span>
            <span className="text-gray-500 text-sm">
              ({product.stockQuantity} kom)
            </span>
          </>
        ) : (
          <>
            <X className="h-5 w-5 text-error" />
            <span className="text-error font-medium">Nema na skladištu</span>
          </>
        )}
      </div>

      {/* Description */}
      <div>
        <h2 className="text-lg font-medium text-primary mb-2">Opis</h2>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-primary mb-3">
            Specifikacije
          </h2>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specifications).map(
                  ([key, value], index) => (
                    <tr
                      key={key}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-600 w-1/3">
                        {key}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary">
                        {value}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
