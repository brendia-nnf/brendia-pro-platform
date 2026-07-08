"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: "hr" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => switchLocale("hr")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "hr"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        HR
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "en"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        EN
      </button>
    </div>
  );
}
