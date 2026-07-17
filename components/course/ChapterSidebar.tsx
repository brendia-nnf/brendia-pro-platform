"use client";

import { useTranslations } from "next-intl";
import { ChapterCard } from "./ChapterCard";
import { Progress } from "@/components/ui";
import type { Chapter, ChapterStatus } from "@/lib/types";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  levelId: string;
  levelTitle: string;
  levelProgress: number;
  chapters: Chapter[];
  statuses: ChapterStatus[];
  currentChapterId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChapterSidebar({
  levelId,
  levelTitle,
  levelProgress,
  chapters,
  statuses,
  currentChapterId,
  isOpen,
  onClose,
}: ChapterSidebarProps) {
  const t = useTranslations("coursePlayer.sidebar");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 bg-white border-l border-gray-100 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-primary">
              {levelTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              aria-label={t("close")}
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <Progress value={levelProgress} size="sm" showLabel label={t("progress")} />
        </div>

        {/* Chapter list */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {chapters.map((chapter, index) => {
            const status = statuses[index];
            return (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                status={status}
                levelId={levelId}
                isActive={chapter.id === currentChapterId}
              />
            );
          })}
        </div>
      </aside>
    </>
  );
}
