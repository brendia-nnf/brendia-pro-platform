"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/providers/CartProvider";
import { Avatar, Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui";
import { CartDrawer } from "@/components/webshop";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Menu, ShoppingBag, User, Settings, LogOut } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { getCartCount, isLoading: cartLoading } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const t = useTranslations("navigation");

  const cartCount = cartLoading ? 0 : getCartCount();

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t("openMenu")}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          <Link href="/dashboard" className="hidden lg:flex items-center">
            <span className="font-heading text-2xl font-semibold text-primary">
              Brendia Pro®
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label={t("cart")}
          >
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-secondary text-white text-xs font-medium rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar name={user?.fullName} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.fullName?.split(" ")[0]}
                </span>
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-primary">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownItem
              icon={<User className="h-4 w-4" />}
              onClick={() => (window.location.href = "/profil")}
            >
              {t("myProfile")}
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => (window.location.href = "/profil")}
            >
              {t("settings")}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              icon={<LogOut className="h-4 w-4" />}
              onClick={logout}
              danger
            >
              {t("logout")}
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
    </>
  );
}
