"use client";

import { useState, useEffect } from "react";
import { Container, Button } from "@/components/ui";
import {
  ApplicationForm,
  StatusTracker,
  CertificateDownload,
} from "@/components/certification";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { CertificationStatus } from "@/lib/types";
import { ArrowLeft, Lock, Loader2, RefreshCw } from "lucide-react";

interface CertificationData {
  id: string;
  status: CertificationStatus;
  appliedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  requirements: {
    level1Completed: boolean;
    level1CompletedAt?: string;
    level2Completed: boolean;
    level2CompletedAt?: string;
    level3Completed?: boolean;
    level3CompletedAt?: string;
  };
}

export default function CertificationPage() {
  const [certification, setCertification] = useState<CertificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations("certification");

  const fetchCertification = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/certification");
      if (!response.ok) {
        throw new Error("Failed to fetch certification status");
      }

      const data = await response.json();
      setCertification(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertification();
  }, []);

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/certification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit application");
      }

      // Refresh certification status
      await fetchCertification();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container size="md">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md">
        <div className="text-center py-12">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchCertification} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("retry")}
          </Button>
        </div>
      </Container>
    );
  }

  // Check if user is eligible
  const isEligible =
    certification?.requirements.level1Completed &&
    certification?.requirements.level2Completed;

  // Not eligible - hasn't completed all levels
  if (!isEligible && certification?.status === "not_eligible") {
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

  const certificationStatus = certification?.status || "eligible";

  return (
    <Container size="md">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          {t("title")}
        </h1>
        <p className="text-gray-600 mt-1">{t("subtitle")}</p>
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
            appliedAt={
              certification?.appliedAt
                ? new Date(certification.appliedAt)
                : new Date()
            }
            rejectionReason={
              certificationStatus === "rejected"
                ? certification?.rejectionReason
                : undefined
            }
          />
        )}

        {/* Show certificate download if approved */}
        {certificationStatus === "approved" && certification?.certificateNumber && (
          <CertificateDownload
            certificateNumber={certification.certificateNumber}
            approvedAt={
              certification.approvedAt
                ? new Date(certification.approvedAt)
                : new Date()
            }
            downloadUrl={certification.certificateUrl}
          />
        )}
      </div>
    </Container>
  );
}
