"use client";

import { useState, useCallback } from "react";
import {
  mockUserProgress,
  calculateLevelProgress,
  getLastWatchedChapter,
  getChapterStatus,
  type UserProgress,
} from "@/lib/mock-data/progress";
import { mockChapters } from "@/lib/mock-data/courses";
import type { ChapterStatus } from "@/lib/types";

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress[]>(mockUserProgress);

  const getLevelProgress = useCallback((levelId: string): number => {
    return calculateLevelProgress(levelId);
  }, []);

  const getLastWatched = useCallback(() => {
    return getLastWatchedChapter();
  }, []);

  const getChapterStatuses = useCallback((levelId: string): ChapterStatus[] => {
    const levelChapters = mockChapters.filter((ch) => ch.levelId === levelId);
    const statuses: ChapterStatus[] = [];

    let previousCompleted = true;

    for (const chapter of levelChapters) {
      const status = getChapterStatus(chapter.id, previousCompleted);
      statuses.push(status);
      previousCompleted = status.state === "completed";
    }

    return statuses;
  }, []);

  const updateChapterProgress = useCallback(
    (chapterId: string, watchPercentage: number) => {
      setProgress((prev) => {
        const existing = prev.find((p) => p.chapterId === chapterId);
        const isCompleted = watchPercentage >= 95;

        if (existing) {
          return prev.map((p) =>
            p.chapterId === chapterId
              ? {
                  ...p,
                  watchPercentage,
                  completed: isCompleted,
                  lastWatchedAt: new Date(),
                }
              : p
          );
        }

        return [
          ...prev,
          {
            chapterId,
            watchPercentage,
            completed: isCompleted,
            lastWatchedAt: new Date(),
          },
        ];
      });
    },
    []
  );

  const isLevel1Complete = useCallback(() => {
    return getLevelProgress("level-1") === 100;
  }, [getLevelProgress]);

  const isLevel2Complete = useCallback(() => {
    return getLevelProgress("level-2") === 100;
  }, [getLevelProgress]);

  const canAccessCertification = useCallback(() => {
    return isLevel1Complete() && isLevel2Complete();
  }, [isLevel1Complete, isLevel2Complete]);

  return {
    progress,
    getLevelProgress,
    getLastWatched,
    getChapterStatuses,
    updateChapterProgress,
    isLevel1Complete,
    isLevel2Complete,
    canAccessCertification,
  };
}
