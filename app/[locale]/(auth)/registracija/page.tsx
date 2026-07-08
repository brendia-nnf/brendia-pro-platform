"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui";
import { LanguageSwitcher } from "@/components/layout";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://brendiapro.hr";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Image */}
      <div className="relative w-full h-[35vh] lg:h-screen lg:w-1/2 xl:w-[55%]">
        <Image
          src="/images/nina-99.jpg"
          alt="Brendia Pro"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />

        {/* Logo on image (mobile only) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Image
            src="/images/logo-white.png"
            alt="Brendia Pro"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex flex-col bg-cream lg:w-1/2 xl:w-[45%]">
        {/* Top bar with logo and language switcher */}
        <div className="flex items-center justify-between px-6 pt-6 lg:px-12 lg:pt-10">
          <Link href="/" className="hidden lg:block">
            <Image
              src="/images/logo.png"
              alt="Brendia Pro"
              width={140}
              height={47}
              className="h-10 w-auto"
            />
          </Link>
          <div className="lg:hidden" />
          <LanguageSwitcher />
        </div>

        {/* Content container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
          <div className="w-full max-w-md text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <GraduationCap className="w-10 h-10 text-secondary" />
            </div>

            {/* Header */}
            <h1 className="text-3xl lg:text-4xl font-heading font-semibold text-primary mb-4">
              Postanite certificirani artist
            </h1>
            <p className="text-primary/60 text-lg mb-8 leading-relaxed">
              Pristup Brendia Pro® platformi dobivate kupnjom jednog od naših certificiranih programa edukacije.
            </p>

            {/* Benefits */}
            <div className="bg-white rounded-xl p-6 mb-8 text-left">
              <p className="text-sm font-medium text-primary mb-4">Što dobivate:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-primary/70">Pristup svim video lekcijama</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-primary/70">Brendia Pro® certifikat</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-primary/70">Welcome Box sa svim materijalima</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-primary/70">Doživotni pristup platformi</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <a href={`${marketingUrl}/hr/courses`}>
              <Button size="lg" className="w-full h-14 text-base group">
                Pogledajte programe
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            {/* Login link */}
            <p className="mt-6 text-primary/60">
              Već imate račun?{" "}
              <Link
                href="/prijava"
                className="text-secondary hover:text-secondary/80 font-medium transition-colors"
              >
                Prijavite se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 lg:px-12">
          <p className="text-center text-xs text-primary/40">
            &copy; {new Date().getFullYear()} Brendia Pro®. Sva prava pridržana.
          </p>
        </div>
      </div>
    </div>
  );
}
