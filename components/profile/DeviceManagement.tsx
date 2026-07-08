"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { mockDevices } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, LogOut } from "lucide-react";

export function DeviceManagement() {
  const [devices, setDevices] = useState(mockDevices);
  const t = useTranslations("profile.devices");

  const handleLogout = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                {device.name.toLowerCase().includes("iphone") ||
                device.name.toLowerCase().includes("android") ? (
                  <Smartphone className="h-5 w-5 text-gray-600" />
                ) : (
                  <Monitor className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-primary">{device.name}</p>
                  {device.isCurrent && (
                    <Badge variant="success" size="sm">
                      {t("current")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {device.browser} · {t("lastActive")}{" "}
                  {formatDate(device.lastActive)}
                </p>
              </div>
            </div>

            {!device.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLogout(device.id)}
              >
                <LogOut className="h-4 w-4 mr-1" />
                {t("logoutButton")}
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {t("maxDevices")}
      </p>
    </Card>
  );
}
