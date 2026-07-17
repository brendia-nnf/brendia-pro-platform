"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Modal, Button } from "@/components/ui";
import { CheckCircle2, ArrowRight, RotateCcw, Camera } from "lucide-react";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  nextChapterId?: string;
  nextChapterTitle?: string;
  levelId: string;
  isLevelComplete: boolean;
  requiresPhotos?: boolean;
  hasSubmission?: boolean;
  onGoToPhotos?: () => void;
}

export function CompletionModal({
  isOpen,
  onClose,
  chapterTitle,
  nextChapterId,
  nextChapterTitle,
  levelId,
  isLevelComplete,
  requiresPhotos = false,
  hasSubmission = false,
  onGoToPhotos,
}: CompletionModalProps) {
  const t = useTranslations("coursePlayer.completion");
  const needsPhotos = requiresPhotos && !hasSubmission;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center py-4">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            needsPhotos ? "bg-secondary/10" : "bg-success/10"
          }`}
        >
          {needsPhotos ? (
            <Camera className="h-10 w-10 text-secondary" />
          ) : (
            <CheckCircle2 className="h-10 w-10 text-success" />
          )}
        </div>

        <h2 className="text-2xl font-heading font-semibold text-primary mb-2">
          {needsPhotos
            ? t("videoWatchedTitle")
            : isLevelComplete
              ? t("levelCompleteTitle")
              : t("chapterCompleteTitle")}
        </h2>

        <p className="text-gray-600 mb-6">
          {needsPhotos
            ? t("photosDescription", { title: chapterTitle })
            : isLevelComplete
              ? t("levelCompleteDescription", { title: chapterTitle })
              : t("chapterCompleteDescription", { title: chapterTitle })}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {needsPhotos ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {t("later")}
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onGoToPhotos?.();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t("submitPhotos")}
              </Button>
            </>
          ) : isLevelComplete ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("backToOverview")}
                </Button>
              </Link>
              <Link href="/certifikat">
                <Button>
                  {t("applyForCertificate")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          ) : nextChapterId ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {t("stayHere")}
              </Button>
              <Link href={`/tecaj/${levelId}/${nextChapterId}`}>
                <Button>
                  {t("next", { title: nextChapterTitle ?? "" })}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          ) : (
            <Button onClick={onClose}>{t("close")}</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
