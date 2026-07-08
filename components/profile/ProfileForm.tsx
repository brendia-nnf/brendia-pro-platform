"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, Save } from "lucide-react";

export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const t = useTranslations("profile.personalInfo");

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    updateUser(formData);
    setIsSaving(false);
    setSaved(true);
  };

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("fullName")}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          leftIcon={<User className="h-5 w-5" />}
          required
        />

        <Input
          label={t("email")}
          type="email"
          value={user?.email || ""}
          leftIcon={<Mail className="h-5 w-5" />}
          disabled
          hint={t("emailHint")}
        />

        <Input
          label={t("phone")}
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          leftIcon={<Phone className="h-5 w-5" />}
          placeholder={t("phonePlaceholder")}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {t("saveButton")}
          </Button>
          {saved && (
            <span className="text-sm text-success">{t("saved")}</span>
          )}
        </div>
      </form>
    </Card>
  );
}
