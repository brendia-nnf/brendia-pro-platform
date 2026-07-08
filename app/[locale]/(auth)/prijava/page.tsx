"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Button, Input } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const t = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        // Check if user is admin and redirect accordingly
        const meResponse = await fetch("/api/auth/me");
        if (meResponse.ok) {
          const userData = await meResponse.json();
          if (userData.user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(t("invalidCredentials"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />

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

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col bg-cream lg:w-1/2 xl:w-[45%]">
        {/* Top bar with logo and language switcher */}
        <div className="flex items-center justify-between px-6 pt-6 lg:px-12 lg:pt-10">
          {/* Logo */}
          <Link href="/" className="hidden lg:block">
            <Image
              src="/images/logo.png"
              alt="Brendia Pro"
              width={140}
              height={47}
              className="h-10 w-auto"
            />
          </Link>
          <div className="lg:hidden" /> {/* Spacer for mobile */}

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-heading font-semibold text-primary mb-3">
                {t("title")}
              </h1>
              <p className="text-primary/60 text-lg">
                {t("subtitle")}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <Input
                  label={t("emailLabel")}
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-5 w-5" />}
                  required
                  autoComplete="email"
                />

                <Input
                  label={t("passwordLabel")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="hover:text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <Link
                  href="/zaboravljena-lozinka"
                  className="text-sm text-secondary hover:text-secondary/80 transition-colors"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-14 text-base"
                size="lg"
                isLoading={isSubmitting || isLoading}
              >
                {t("submitButton")}
              </Button>
            </form>

            {/* Register link */}
            <p className="mt-8 text-center text-primary/60">
              {t("noAccount")}{" "}
              <Link
                href="/registracija"
                className="text-secondary hover:text-secondary/80 font-medium transition-colors"
              >
                {t("registerLink")}
              </Link>
            </p>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-primary/10">
              <p className="text-center text-xs text-primary/40">
                &copy; {new Date().getFullYear()} Brendia Pro®. Sva prava pridržana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
