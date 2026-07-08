"use client";

import { Container, Card, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { ProfileForm, DeviceManagement, PurchaseHistory } from "@/components/profile";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const t = useTranslations("profile");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t("password.demoDisabled"));
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

            <Button type="submit" className="mt-2">
              {t("password.changeButton")}
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
