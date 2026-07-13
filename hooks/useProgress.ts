"use client";

import { useState, useEffect, useCallback } from "react";

export interface LevelProgressInfo {
  id: string;
  levelNumber: number;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  isLocked: boolean;
  lockReason?: string | null;
  firstChapterId: string | null;
  progressPercentage: number;
  totalChapters: number;
  completedChapters: number;
}

interface ProgressByLevel {
  levelNumber: number;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
}

export function useProgress() {
  const [levels, setLevels] = useState<LevelProgressInfo[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [certificationStatus, setCertificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [levelsRes, progressRes, certRes] = await Promise.all([
        fetch("/api/course/levels"),
        fetch("/api/progress"),
        fetch("/api/certification"),
      ]);

      const levelsData = levelsRes.ok ? await levelsRes.json() : { levels: [] };
      const progressData = progressRes.ok ? await progressRes.json() : null;
      const certData = certRes.ok ? await certRes.json() : null;

      const progressByLevel = new Map<number, ProgressByLevel>(
        ((progressData?.byLevel || []) as ProgressByLevel[]).map((p) => [
          p.levelNumber,
          p,
        ])
      );

      interface ApiLevel {
        id: string;
        levelNumber: number;
        title: string;
        titleEn?: string | null;
        description?: string | null;
        descriptionEn?: string | null;
        isLocked: boolean;
        lockReason?: string | null;
        chapters?: Array<{ id: string }>;
      }

      setLevels(
        ((levelsData?.levels || []) as ApiLevel[]).map((level) => {
          const progress = progressByLevel.get(level.levelNumber);
          return {
            id: level.id,
            levelNumber: level.levelNumber,
            title: level.title,
            titleEn: level.titleEn,
            description: level.description,
            descriptionEn: level.descriptionEn,
            isLocked: level.isLocked,
            lockReason: level.lockReason,
            firstChapterId: level.chapters?.[0]?.id || null,
            progressPercentage: progress?.progressPercentage ?? 0,
            totalChapters: progress?.totalChapters ?? 0,
            completedChapters: progress?.completedChapters ?? 0,
          };
        })
      );

      setOverallProgress(progressData?.overall?.progressPercentage || 0);
      setCertificationStatus(certData?.status || null);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getLevelProgress = useCallback(
    (levelNumber: number): number => {
      return (
        levels.find((l) => l.levelNumber === levelNumber)?.progressPercentage ?? 0
      );
    },
    [levels]
  );

  // Certificate page is reachable once the user is at least eligible
  const canAccessCertification =
    certificationStatus !== null && certificationStatus !== "not_eligible";

  // The "apply now" banner only makes sense while eligible and not yet applied
  const isCertificationEligible = certificationStatus === "eligible";

  return {
    loading,
    levels,
    overallProgress,
    certificationStatus,
    canAccessCertification,
    isCertificationEligible,
    getLevelProgress,
    refresh: fetchAll,
  };
}
