"use client";

import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AuthHeader() {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-heading text-3xl font-semibold text-primary">
            Brendia Pro®
          </span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
