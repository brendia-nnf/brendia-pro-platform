"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, Button } from "@/components/ui";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

interface ApplicationFormProps {
  onApply: () => void;
  isSubmitting: boolean;
}

export function ApplicationForm({ onApply, isSubmitting }: ApplicationFormProps) {
  const [confirmed, setConfirmed] = useState(false);
  const t = useTranslations("certification.application");

  return (
    <Card>
      <CardHeader className="mb-6">
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        <p className="text-gray-600">
          {t("description")}
        </p>

        <div className="bg-cream rounded-lg p-4">
          <h4 className="font-medium text-primary mb-2">{t("requirementsTitle")}</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>{t("requirement1")}</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>{t("requirement2")}</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>{t("requirement3")}</span>
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-secondary transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
          />
          <span className="text-sm text-gray-600">
            {t("confirmation")}
          </span>
        </label>

        <Button
          onClick={onApply}
          disabled={!confirmed}
          isLoading={isSubmitting}
          className="w-full"
          size="lg"
        >
          {t("submitButton")}
        </Button>
      </div>
    </Card>
  );
}
