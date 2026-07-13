"use client";

import Link from "next/link";
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
            ? "Video pogledan!"
            : isLevelComplete
              ? "Razina završena!"
              : "Poglavlje završeno!"}
        </h2>

        <p className="text-gray-600 mb-6">
          {needsPhotos
            ? `Odlično! Sada primijenite tehniku iz "${chapterTitle}" na svom modelu i pošaljite tri fotografije rada (sprijeda, s lijeve i desne strane). Time se otključava sljedeće poglavlje.`
            : isLevelComplete
              ? `Čestitamo! Završili ste "${chapterTitle}" i cijelu razinu.`
              : `Uspješno ste završili "${chapterTitle}".`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {needsPhotos ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Kasnije
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onGoToPhotos?.();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Pošalji fotografije rada
              </Button>
            </>
          ) : isLevelComplete ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Natrag na pregled
                </Button>
              </Link>
              <Link href="/certifikat">
                <Button>
                  Prijavi se za certifikat
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          ) : nextChapterId ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Ostani ovdje
              </Button>
              <Link href={`/tecaj/${levelId}/${nextChapterId}`}>
                <Button>
                  Sljedeće: {nextChapterTitle}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          ) : (
            <Button onClick={onClose}>Zatvori</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
