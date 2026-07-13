"use client";

import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { useTranslations } from "next-intl";
import { Package, Truck, CheckCircle2, Loader2 } from "lucide-react";

type KitStatusType = "preparing" | "shipped" | "delivered";

interface KitData {
  status: KitStatusType;
  trackingNumber: string | null;
  shippedAt: string | null;
}

export function KitStatus() {
  const [kit, setKit] = useState<KitData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard.kit");

  useEffect(() => {
    const fetchKit = async () => {
      try {
        const response = await fetch("/api/user/kit");
        if (response.ok) {
          const data = await response.json();
          if (
            data.kit &&
            ["preparing", "shipped", "delivered"].includes(data.kit.status)
          ) {
            setKit(data.kit);
          }
        }
      } catch (error) {
        console.error("Failed to fetch kit status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKit();
  }, []);

  if (loading) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </Card>
    );
  }

  // No active enrollment - nothing to show
  if (!kit) {
    return null;
  }

  const status = kit.status;

  const statuses = {
    preparing: {
      label: t("preparing"),
      description: t("preparingDescription"),
      icon: Package,
      badge: "warning" as const,
      progress: 1,
    },
    shipped: {
      label: t("shipped"),
      description: t("shippedDescription"),
      icon: Truck,
      badge: "secondary" as const,
      progress: 2,
    },
    delivered: {
      label: t("delivered"),
      description: t("deliveredDescription"),
      icon: CheckCircle2,
      badge: "success" as const,
      progress: 3,
    },
  };

  const currentStatus = statuses[status];
  const StatusIcon = currentStatus.icon;

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            status === "delivered"
              ? "bg-success/10 text-success"
              : status === "shipped"
                ? "bg-secondary/10 text-secondary"
                : "bg-warning/10 text-warning"
          }`}
        >
          <StatusIcon className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary">Brendia Pro® Kit</h3>
            <Badge variant={currentStatus.badge} size="sm">
              {currentStatus.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-4">{currentStatus.description}</p>

          {status === "shipped" && kit.trackingNumber && (
            <p className="text-sm text-gray-600 mb-4">
              {t("trackingNumber")}:{" "}
              <span className="font-medium text-primary">
                {kit.trackingNumber}
              </span>
            </p>
          )}

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full ${
                  step <= currentStatus.progress
                    ? status === "delivered"
                      ? "bg-success"
                      : "bg-secondary"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{t("stepPreparing")}</span>
            <span>{t("stepShipping")}</span>
            <span>{t("stepDelivered")}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
