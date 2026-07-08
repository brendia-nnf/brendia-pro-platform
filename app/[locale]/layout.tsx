import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import type { Metadata } from "next";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const metadata = messages.metadata as Record<string, string>;

  return {
    title: metadata?.title || "Brendia Pro®",
    description: metadata?.description || "",
    alternates: {
      languages: {
        hr: "/hr",
        en: "/en",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  if (!routing.locales.includes(locale as "hr" | "en")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Fetch messages for the current locale
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cormorantGaramond.variable} ${inter.variable}`}
    >
      <head>
        <link rel="alternate" hrefLang="hr" href="/hr" />
        <link rel="alternate" hrefLang="en" href="/en" />
        <link rel="alternate" hrefLang="x-default" href="/hr" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
