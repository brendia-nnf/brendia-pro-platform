"use client";

import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { mockPurchases } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function PurchaseHistory() {
  const t = useTranslations("profile.purchases");

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

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
            {mockPurchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(purchase.date)}
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
                      purchase.status === "completed"
                        ? "success"
                        : purchase.status === "pending"
                          ? "warning"
                          : "error"
                    }
                    size="sm"
                  >
                    {purchase.status === "completed"
                      ? t("paid")
                      : purchase.status === "pending"
                        ? t("pending")
                        : t("refunded")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mockPurchases.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {t("empty")}
        </p>
      )}
    </Card>
  );
}
