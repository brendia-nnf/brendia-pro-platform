"use client";

import { useState } from "react";
import { Container, Button } from "@/components/ui";
import {
  ApplicationForm,
  StatusTracker,
  CertificateDownload,
} from "@/components/certification";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { getCertificationForUser } from "@/lib/mock-data";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { CertificationStatus } from "@/lib/types";
import { ArrowLeft, Lock } from "lucide-react";

export default function CertificationPage() {
  const { user } = useAuth();
  const { canAccessCertification } = useProgress();
  const t = useTranslations("certification");

  const [certificationStatus, setCertificationStatus] =
    useState<CertificationStatus>(() => {
      const cert = user ? getCertificationForUser(user.id) : undefined;
      return cert?.status || "eligible";
    });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCertificationStatus("applied");
    setIsSubmitting(false);
  };

  // Not eligible - hasn't completed all levels
  if (!canAccessCertification()) {
    return (
      <Container size="md">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-heading font-semibold text-primary mb-2">
            {t("notAvailable.title")}
          </h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {t("notAvailable.description")}
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("notAvailable.backButton")}
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container size="md">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          {t("title")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Show application form if eligible but not applied */}
        {certificationStatus === "eligible" && (
          <ApplicationForm onApply={handleApply} isSubmitting={isSubmitting} />
        )}

        {/* Show status tracker if applied */}
        {(certificationStatus === "applied" ||
          certificationStatus === "under_review" ||
          certificationStatus === "approved" ||
          certificationStatus === "rejected") && (
          <StatusTracker
            status={certificationStatus}
            appliedAt={new Date()}
            rejectionReason={
              certificationStatus === "rejected"
                ? "Molimo vas da dostavite dodatne fotografije vašeg rada."
                : undefined
            }
          />
        )}

        {/* Show certificate download if approved */}
        {certificationStatus === "approved" && (
          <CertificateDownload
            certificateNumber="BP-2024-00123"
            approvedAt={new Date()}
          />
        )}

        {/* Demo controls - for testing different states */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-3 text-center">
            <strong>{t("demo.title")}</strong> {t("demo.subtitle")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {(
              [
                "eligible",
                "applied",
                "under_review",
                "approved",
                "rejected",
              ] as CertificationStatus[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => setCertificationStatus(status)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  certificationStatus === status
                    ? "bg-secondary text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
