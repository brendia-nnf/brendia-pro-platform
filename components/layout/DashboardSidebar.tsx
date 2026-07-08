"use client";

import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  ShoppingBag,
  X,
  ChevronRight,
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { getLevelProgress, canAccessCertification } = useProgress();
  const t = useTranslations("navigation");

  const navItems = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/tecaj/level-1/ch-1-1",
      label: t("level1"),
      icon: BookOpen,
      levelId: "level-1",
    },
    {
      href: "/tecaj/level-2/ch-2-1",
      label: t("level2"),
      icon: BookOpen,
      levelId: "level-2",
    },
    {
      href: "/webshop",
      label: t("webshop"),
      icon: ShoppingBag,
    },
    {
      href: "/certifikat",
      label: t("certificate"),
      icon: Award,
      requiresCertification: true,
    },
    {
      href: "/profil",
      label: t("profile"),
      icon: User,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-100 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto lg:min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
          <span className="font-heading text-xl font-semibold text-primary">
            Brendia Pro®
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t("closeMenu")}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.levelId && pathname.includes(item.levelId));

            // Check if certification link should be hidden
            if (item.requiresCertification && !canAccessCertification()) {
              return null;
            }

            const progress = item.levelId
              ? getLevelProgress(item.levelId)
              : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                  isActive
                    ? "bg-secondary/10 text-secondary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-secondary" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span className="flex-1 font-medium">{item.label}</span>
                {progress !== null && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      progress === 100
                        ? "bg-success/10 text-success"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {progress}%
                  </span>
                )}
                <ChevronRight
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform",
                    isActive ? "text-secondary" : "text-gray-300 group-hover:text-gray-400"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-cream rounded-lg p-4">
            <p className="text-sm font-medium text-primary mb-1">
              {t("needHelp")}
            </p>
            <p className="text-xs text-gray-600 mb-3">
              {t("contactSupport")}
            </p>
            <a
              href="mailto:podrska@brendiapro.hr"
              className="text-sm font-medium text-secondary hover:text-accent transition-colors"
            >
              podrska@brendiapro.hr
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
