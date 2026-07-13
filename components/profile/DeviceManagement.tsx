"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, LogOut, Loader2 } from "lucide-react";

interface Device {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  isCurrent: boolean;
  lastActive: string;
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const t = useTranslations("profile.devices");

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch("/api/user/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleLogout = async (deviceId: string) => {
    setRemoving(deviceId);
    try {
      const response = await fetch(`/api/user/devices/${deviceId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      }
    } catch (error) {
      console.error("Failed to remove device:", error);
    } finally {
      setRemoving(null);
    }
  };

  const isMobile = (device: Device) =>
    device.deviceType === "mobile" ||
    device.deviceType === "tablet" ||
    (device.deviceName || "").toLowerCase().includes("iphone") ||
    (device.deviceName || "").toLowerCase().includes("android");

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  {isMobile(device) ? (
                    <Smartphone className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Monitor className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-primary">
                      {device.deviceName || device.os || "—"}
                    </p>
                    {device.isCurrent && (
                      <Badge variant="success" size="sm">
                        {t("current")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {device.browser ? `${device.browser} · ` : ""}
                    {t("lastActive")} {formatDate(new Date(device.lastActive))}
                  </p>
                </div>
              </div>

              {!device.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLogout(device.id)}
                  disabled={removing === device.id}
                >
                  {removing === device.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-1" />
                  )}
                  {t("logoutButton")}
                </Button>
              )}
            </div>
          ))}

          {devices.length === 0 && (
            <p className="text-center text-gray-500 py-4">{t("empty")}</p>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500">
        {t("maxDevices")}
      </p>
    </Card>
  );
}
