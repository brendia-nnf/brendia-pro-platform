"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { CartItem } from "./CartItem";
import { useCart } from "@/providers/CartProvider";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, getSubtotal, getCartCount } = useCart();
  const t = useTranslations("webshop.cart");

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-semibold text-primary">
              {t("title")} ({getCartCount()})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t("closeCart")}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">
                {t("empty")}
              </h3>
              <p className="text-gray-500 mb-6">
                {t("addProducts")}
              </p>
              <Button onClick={onClose} variant="outline">
                {t("continueShopping")}
              </Button>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} compact />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex justify-between text-lg font-semibold text-primary">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              {t("shippingNote")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/webshop/kosarica" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  {t("viewCart")}
                </Button>
              </Link>
              <Link href="/webshop/blagajna" onClick={onClose}>
                <Button className="w-full">{t("checkout")}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
