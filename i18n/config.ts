export const locales = ["hr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "hr";

export const localeNames: Record<Locale, string> = {
  hr: "Hrvatski",
  en: "English",
};
