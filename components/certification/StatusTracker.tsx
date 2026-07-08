"use client";

import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import type { CertificationStatus } from "@/lib/types";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusTrackerProps {
  status: CertificationStatus;
  appliedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export function StatusTracker({
  status,
  rejectionReason,
}: StatusTrackerProps) {
  const t = useTranslations("certification.status");

  const steps = [
    { id: "applied", label: t("applied"), icon: FileText },
    { id: "under_review", label: t("underReview"), icon: Clock },
    { id: "approved", label: t("approved"), icon: CheckCircle2 },
  ];

  const getStepStatus = (stepId: string) => {
    if (status === "rejected") {
      if (stepId === "applied") return "completed";
      if (stepId === "under_review") return "error";
      return "pending";
    }

    const statusOrder = ["applied", "under_review", "approved"];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getStatusLabel = () => {
    switch (status) {
      case "applied":
        return t("applied");
      case "under_review":
        return t("underReview");
      case "approved":
        return t("approved");
      case "rejected":
        return t("rejected");
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader className="mb-6">
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant={
              status === "approved"
                ? "success"
                : status === "rejected"
                  ? "error"
                  : status === "under_review"
                    ? "warning"
                    : "secondary"
            }
          >
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>

      {/* Progress steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.id);
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex-1">
                <div className="flex flex-col items-center">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center z-10 relative",
                      stepStatus === "completed" && "bg-success text-white",
                      stepStatus === "current" && "bg-secondary text-white",
                      stepStatus === "pending" && "bg-gray-100 text-gray-400",
                      stepStatus === "error" && "bg-error text-white"
                    )}
                  >
                    {stepStatus === "error" ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={cn(
                      "mt-2 text-sm font-medium text-center",
                      stepStatus === "completed" && "text-success",
                      stepStatus === "current" && "text-secondary",
                      stepStatus === "pending" && "text-gray-400",
                      stepStatus === "error" && "text-error"
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-6 h-0.5 -translate-y-1/2",
                      "left-1/3 right-1/3"
                    )}
                    style={{
                      left: `${(index + 0.5) * (100 / steps.length)}%`,
                      width: `${100 / steps.length}%`,
                    }}
                  >
                    <div
                      className={cn(
                        "h-full",
                        getStepStatus(steps[index + 1].id) !== "pending"
                          ? "bg-success"
                          : "bg-gray-200"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection reason */}
      {status === "rejected" && rejectionReason && (
        <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm font-medium text-error mb-1">
            {t("rejectionReason")}
          </p>
          <p className="text-sm text-gray-700">{rejectionReason}</p>
        </div>
      )}

      {/* Status message */}
      {status === "under_review" && (
        <p className="mt-6 text-sm text-gray-600 text-center">
          {t("reviewMessage")}
        </p>
      )}
    </Card>
  );
}
