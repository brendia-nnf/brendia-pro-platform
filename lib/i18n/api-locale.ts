import { NextRequest } from "next/server";

/**
 * Locale for API responses. The web app carries next-intl's NEXT_LOCALE
 * cookie; the mobile app (Croatian-only) sends none and gets the default.
 */
export function getRequestLocale(request: NextRequest): "hr" | "en" {
  return request.cookies.get("NEXT_LOCALE")?.value === "en" ? "en" : "hr";
}

/** Pick the localized variant, falling back to Croatian when missing. */
export function localized(
  locale: "hr" | "en",
  hr: string | null,
  en: string | null
): string | null {
  return locale === "en" && en ? en : hr;
}
