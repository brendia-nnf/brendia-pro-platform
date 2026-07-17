"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Camera,
  Award,
  Ticket,
  ShoppingBag,
  Package,
  MessageCircle,
  ArrowLeft,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminNavItems = [
  {
    href: "/admin",
    label: "Pregled",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/studenti",
    label: "Studenti",
    icon: Users,
  },
  {
    href: "/admin/sadrzaj",
    label: "Sadržaj tečaja",
    icon: BookOpen,
  },
  {
    href: "/admin/radovi",
    label: "Radovi studenata",
    icon: Camera,
  },
  {
    href: "/admin/certifikati",
    label: "Certifikati",
    icon: Award,
  },
  {
    href: "/admin/kuponi",
    label: "Kuponi",
    icon: Ticket,
  },
  {
    href: "/admin/proizvodi",
    label: "Proizvodi",
    icon: ShoppingBag,
  },
  {
    href: "/admin/narudzbe",
    label: "Narudžbe",
    icon: Package,
  },
  {
    href: "/admin/poruke",
    label: "Poruke",
    icon: MessageCircle,
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

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
          "fixed top-0 left-0 z-50 h-full w-72 bg-primary text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto lg:min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <span className="font-heading text-xl font-semibold">
              Brendia Pro®
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Administracija</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Zatvori izbornik"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                  isActive
                    ? "bg-secondary text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to dashboard link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Natrag na platformu</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
