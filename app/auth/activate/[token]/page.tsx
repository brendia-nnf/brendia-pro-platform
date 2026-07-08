"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface TokenValidation {
  valid: boolean;
  error?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  courseName?: string;
  orderNumber?: string;
}

export default function ActivatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/auth/activate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setValidation({ valid: false, error: data.error });
        } else {
          setValidation({
            valid: true,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            courseName: data.courseName,
            orderNumber: data.orderNumber,
          });
        }
      } catch {
        setValidation({ valid: false, error: "Failed to validate token" });
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setPasswordError("Lozinka mora imati najmanje 8 znakova");
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError("Lozinke se ne podudaraju");
      return false;
    }

    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Aktivacija nije uspjela");
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login?activated=true");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo je do greške");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Provjeravamo vaš link...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-gray-900 mb-4">
            Neispravan link
          </h1>
          <p className="text-gray-600 mb-6">
            {validation?.error === "Token expired"
              ? "Vaš link za aktivaciju je istekao. Molimo kontaktirajte nas za novi link."
              : validation?.error === "Already activated"
              ? "Ovaj račun je već aktiviran. Možete se prijaviti."
              : "Link za aktivaciju nije valjan. Molimo provjerite jeste li kopirali cijeli link iz emaila."}
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-secondary text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
            >
              Prijava
            </Link>
            <a
              href="mailto:info@brendiapro.hr"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Kontaktirajte nas
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-gray-900 mb-4">
            Račun aktiviran!
          </h1>
          <p className="text-gray-600 mb-6">
            Vaš račun je uspješno aktiviran. Sada možete pristupiti svom tečaju.
          </p>
          <p className="text-sm text-gray-500">
            Preusmjeravamo vas na prijavu...
          </p>
        </div>
      </div>
    );
  }

  // Activation form
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Brendia Pro"
              width={150}
              height={50}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-heading font-semibold text-gray-900 mb-2 text-center">
            Aktivirajte svoj račun
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Dobrodošli, {validation.firstName}! Postavite lozinku za pristup platformi.
          </p>

          {/* Order Info */}
          <div className="bg-cream rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Tečaj</p>
            <p className="font-medium text-gray-900">{validation.courseName}</p>
            <p className="text-xs text-gray-400 mt-1">
              Narudžba: {validation.orderNumber}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={validation.email}
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Najmanje 8 znakova"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                required
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potvrdite lozinku
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ponovite lozinku"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                required
              />
            </div>

            {/* Password Error */}
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            {/* Submit Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-secondary text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Aktivacija...
                </>
              ) : (
                "Aktiviraj račun"
              )}
            </button>
          </form>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Imate problema?{" "}
          <a href="mailto:info@brendiapro.hr" className="text-secondary hover:underline">
            Kontaktirajte nas
          </a>
        </p>
      </div>
    </div>
  );
}
