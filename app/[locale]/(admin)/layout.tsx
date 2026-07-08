"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations("navigation");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/prijava");
      } else if (user?.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="flex">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar for mobile */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-100 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={t("openMenu")}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <span className="font-heading text-xl font-semibold text-primary">
                Administracija
              </span>
              <div className="w-10" />
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
