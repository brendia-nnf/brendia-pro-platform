"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface Purchase {
  id: string;
  type: "course" | "webshop";
  description: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

const SUCCESS_STATUSES = ["active", "paid", "completed", "shipped", "delivered"];
const PENDING_STATUSES = ["pending", "processing"];

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("profile.purchases");

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch("/api/user/purchases");
        if (response.ok) {
          const data = await response.json();
          setPurchases(data.purchases || []);
        }
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="mb-6">
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      {purchases.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t("date")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t("description")}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  {t("amount")}
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                  {t("status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(new Date(purchase.date))}
                  </td>
                  <td className="py-3 px-4 text-sm text-primary font-medium">
                    {purchase.description}
                  </td>
                  <td className="py-3 px-4 text-sm text-primary text-right">
                    {purchase.amount.toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        SUCCESS_STATUSES.includes(purchase.status)
                          ? "success"
                          : PENDING_STATUSES.includes(purchase.status)
                            ? "warning"
                            : "error"
                      }
                      size="sm"
                    >
                      {SUCCESS_STATUSES.includes(purchase.status)
                        ? t("paid")
                        : PENDING_STATUSES.includes(purchase.status)
                          ? t("pending")
                          : t("refunded")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {purchases.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {t("empty")}
        </p>
      )}
    </Card>
  );
}
