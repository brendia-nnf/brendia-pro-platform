import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, locale: string = "hr"): string {
  const localeMap: Record<string, string> = {
    hr: "hr-HR",
    en: "en-US",
  };
  return new Intl.DateTimeFormat(localeMap[locale] || "hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function calculateProgress(watched: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((watched / total) * 100);
}
