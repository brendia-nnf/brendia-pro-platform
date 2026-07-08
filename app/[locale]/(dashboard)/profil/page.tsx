"use client";

import { Container, Card, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { ProfileForm, DeviceManagement, PurchaseHistory } from "@/components/profile";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const t = useTranslations("profile");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validate passwords match
    if (passwords.new !== passwords.confirm) {
      setPasswordError(t("password.mismatch"));
      return;
    }

    // Validate password strength
    if (passwords.new.length < 8) {
      setPasswordError(t("password.tooShort"));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.new)) {
      setPasswordError(t("password.requirements"));
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
          confirmPassword: passwords.confirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container size="lg">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          {t("title")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile form */}
        <ProfileForm />

        {/* Password change */}
        <Card>
          <CardHeader className="mb-6">
            <CardTitle>{t("password.title")}</CardTitle>
          </CardHeader>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span>{t("password.success")}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error">
              <AlertCircle className="h-5 w-5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label={t("password.current")}
              type={showPasswords ? "text" : "password"}
              name="current"
              value={passwords.current}
              onChange={handlePasswordChange}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="hover:text-gray-600 transition-colors"
                >
                  {showPasswords ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
            />

            <Input
              label={t("password.new")}
              type={showPasswords ? "text" : "password"}
              name="new"
              value={passwords.new}
              onChange={handlePasswordChange}
              leftIcon={<Lock className="h-5 w-5" />}
              hint={t("password.newHint")}
            />

            <Input
              label={t("password.confirm")}
              type={showPasswords ? "text" : "password"}
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              leftIcon={<Lock className="h-5 w-5" />}
            />

            <Button
              type="submit"
              className="mt-2"
              disabled={passwordLoading || !passwords.current || !passwords.new || !passwords.confirm}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("password.changing")}
                </>
              ) : (
                t("password.changeButton")
              )}
            </Button>
          </form>
        </Card>

        {/* Device management - full width */}
        <div className="lg:col-span-2">
          <DeviceManagement />
        </div>

        {/* Purchase history - full width */}
        <div className="lg:col-span-2">
          <PurchaseHistory />
        </div>
      </div>
    </Container>
  );
}
