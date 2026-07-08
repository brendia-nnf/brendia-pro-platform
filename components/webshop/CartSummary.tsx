"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { useCart } from "@/providers/CartProvider";
import { SHIPPING_THRESHOLD } from "@/lib/types/webshop";
import { Truck, ShieldCheck } from "lucide-react";

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

export function CartSummary({ showCheckoutButton = true }: CartSummaryProps) {
  const { items, getSubtotal, getShipping, getCartTotal } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getCartTotal();

  const amountToFreeShipping = SHIPPING_THRESHOLD - subtotal;
  const hasFreeShipping = amountToFreeShipping <= 0;

  return (
    <Card variant="outline" padding="lg">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Sažetak narudžbe
      </h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-600">
          <span>Međuzbroj ({items.length} artikala)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-gray-600">
          <span>Dostava</span>
          <span className={hasFreeShipping ? "text-success" : ""}>
            {hasFreeShipping ? "Besplatno" : formatPrice(shipping)}
          </span>
        </div>

        {/* Free shipping progress */}
        {!hasFreeShipping && (
          <div className="py-3 px-4 bg-cream rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-secondary" />
              <span className="text-sm text-gray-600">
                Dodajte još{" "}
                <strong className="text-primary">
                  {formatPrice(amountToFreeShipping)}
                </strong>{" "}
                za besplatnu dostavu
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3" />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold text-primary">
          <span>Ukupno</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* VAT note */}
        <p className="text-xs text-gray-500">Uključuje PDV</p>

        {/* Checkout button */}
        {showCheckoutButton && items.length > 0 && (
          <Link href="/webshop/blagajna" className="block mt-4">
            <Button className="w-full" size="lg">
              Nastavi na plaćanje
            </Button>
          </Link>
        )}

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Sigurna kupnja</span>
        </div>
      </div>
    </Card>
  );
}
