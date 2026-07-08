"use client";

import Link from "next/link";
import { Modal, Button } from "@/components/ui";
import { CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  nextChapterId?: string;
  nextChapterTitle?: string;
  levelId: string;
  isLevelComplete: boolean;
}

export function CompletionModal({
  isOpen,
  onClose,
  chapterTitle,
  nextChapterId,
  nextChapterTitle,
  levelId,
  isLevelComplete,
}: CompletionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>

        <h2 className="text-2xl font-heading font-semibold text-primary mb-2">
          {isLevelComplete ? "Razina završena!" : "Poglavlje završeno!"}
        </h2>

        <p className="text-gray-600 mb-6">
          {isLevelComplete
            ? `Čestitamo! Završili ste "${chapterTitle}" i cijelu razinu.`
            : `Uspješno ste završili "${chapterTitle}".`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isLevelComplete ? (
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
