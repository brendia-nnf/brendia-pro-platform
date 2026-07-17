"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { Loader2, Package, ChevronDown, ChevronUp, Truck } from "lucide-react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
}

const STATUS_VARIANTS: Record<
  string,
  { variant: "success" | "warning" | "error" | "default"; key: string }
> = {
  paid: { variant: "success", key: "paid" },
  processing: { variant: "warning", key: "processing" },
  shipped: { variant: "success", key: "shipped" },
  delivered: { variant: "success", key: "delivered" },
  pending: { variant: "warning", key: "pending" },
  cancelled: { variant: "error", key: "cancelled" },
  refunded: { variant: "default", key: "refunded" },
};

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/user/orders");
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-primary">
          {t("title")}
        </h1>
        <p className="text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">{t("empty")}</p>
          <p className="text-gray-400 text-sm mb-6">{t("emptyHint")}</p>
          <Link
            href="/webshop"
            className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("goToWebshop")}
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status =
              STATUS_VARIANTS[order.status] || STATUS_VARIANTS.pending;
            const isExpanded = expandedId === order.id;

            return (
              <Card key={order.id} className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.id)
                  }
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-primary">
                        {order.orderNumber}
                      </span>
                      <Badge variant={status.variant}>
                        {t(`status.${status.key}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(new Date(order.createdAt))} ·{" "}
                      {t("itemCount", {
                        count: order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        ),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-primary">
                      {formatPrice(order.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-4">
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm bg-secondary/5 rounded-lg px-4 py-3">
                        <Truck className="h-4 w-4 text-secondary" />
                        <span className="text-gray-600">
                          {t("trackingNumber")}:
                        </span>
                        <span className="font-medium text-primary">
                          {order.trackingNumber}
                        </span>
                      </div>
                    )}

                    <div className="divide-y divide-gray-50">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between py-2 text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name}{" "}
                            <span className="text-gray-400">
                              × {item.quantity}
                            </span>
                          </span>
                          <span className="text-gray-700">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>{t("subtotal")}</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>{t("shipping")}</span>
                        <span>
                          {order.shipping === 0
                            ? t("freeShipping")
                            : formatPrice(order.shipping)}
                        </span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>{t("discount")}</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-primary pt-1">
                        <span>{t("total")}</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
