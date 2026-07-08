"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui";
import { useTranslations } from "next-intl";

export function WelcomeCard() {
  const { user } = useAuth();
  const t = useTranslations("dashboard.welcome");
  const firstName = user?.fullName?.split(" ")[0] || "Korisnik";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("morning");
    if (hour < 18) return t("afternoon");
    return t("evening");
  };

  return (
    <Card
      variant="elevated"
      className="bg-gradient-to-r from-primary to-gray-800 text-white"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold mb-2">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-gray-300">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-3xl md:text-4xl">👋</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
