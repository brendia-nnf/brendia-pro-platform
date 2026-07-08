"use client";

import { Card, Button } from "@/components/ui";
import { useTranslations } from "next-intl";
import { Award, Download, Share2 } from "lucide-react";

interface CertificateDownloadProps {
  certificateNumber?: string;
  approvedAt?: Date;
}

export function CertificateDownload({
  certificateNumber,
}: CertificateDownloadProps) {
  const t = useTranslations("certification.certificate");
  const tDemo = useTranslations("demo");

  const handleDownload = () => {
    alert(tDemo("downloadNotAvailable"));
  };

  const handleShare = () => {
    alert(tDemo("shareNotAvailable"));
  };

  return (
    <Card className="text-center">
      {/* Certificate preview */}
      <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-8 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <Award className="h-16 w-16 text-secondary mx-auto mb-4" />
          <h3 className="text-2xl font-heading font-semibold text-primary mb-2">
            {t("title")}
          </h3>
          <p className="text-gray-600 mb-4">
            {t("confirmation")}
            <br />
            <strong className="text-primary">Ana Kovačević</strong>
            <br />
            {t("completedEducation")}
            <br />
            <strong className="text-secondary">
              {t("expertTitle")}
            </strong>
          </p>
          {certificateNumber && (
            <p className="text-xs text-gray-400">
              {t("certificateNumber")} {certificateNumber}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          {t("downloadPdf")}
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          {t("share")}
        </Button>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {t("usageNote")}
      </p>
    </Card>
  );
}
