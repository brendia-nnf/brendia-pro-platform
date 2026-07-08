import type { ChapterStatus } from "@/lib/types";

export interface UserProgress {
  chapterId: string;
  watchPercentage: number;
  completed: boolean;
  lastWatchedAt: Date;
}

// Mock progress data for the current user
export const mockUserProgress: UserProgress[] = [
  // Level 1 - All completed
  {
    chapterId: "ch-1-1",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-01"),
  },
  {
    chapterId: "ch-1-2",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-03"),
  },
  {
    chapterId: "ch-1-3",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-05"),
  },
  {
    chapterId: "ch-1-4",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-08"),
  },
  {
    chapterId: "ch-1-5",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-10"),
  },

  // Level 2 - Partially completed
  {
    chapterId: "ch-2-1",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-15"),
  },
  {
    chapterId: "ch-2-2",
    watchPercentage: 100,
    completed: true,
    lastWatchedAt: new Date("2024-02-18"),
  },
  {
    chapterId: "ch-2-3",
    watchPercentage: 65,
    completed: false,
    lastWatchedAt: new Date("2024-03-20"),
  },
];

export function getProgressForChapter(chapterId: string): UserProgress | undefined {
  return mockUserProgress.find((p) => p.chapterId === chapterId);
}

export function getChapterStatus(
  chapterId: string,
  previousChapterCompleted: boolean = true
): ChapterStatus {
  const progress = getProgressForChapter(chapterId);

  if (!previousChapterCompleted && !progress?.completed) {
    return {
      chapterId,
      state: "locked",
      watchPercentage: 0,
    };
  }

  if (!progress) {
    return {
      chapterId,
      state: previousChapterCompleted ? "available" : "locked",
      watchPercentage: 0,
    };
  }

  if (progress.completed) {
    return {
      chapterId,
      state: "completed",
      watchPercentage: 100,
    };
  }

  return {
    chapterId,
    state: "in_progress",
    watchPercentage: progress.watchPercentage,
  };
}

export function calculateLevelProgress(levelId: string): number {
  const levelChapters = mockUserProgress.filter((p) =>
    p.chapterId.startsWith(levelId === "level-1" ? "ch-1" : levelId === "level-2" ? "ch-2" : "ch-3")
  );

  const totalChapters = levelId === "level-1" ? 5 : levelId === "level-2" ? 6 : 3;
  const totalWatched = levelChapters.reduce((acc, p) => acc + p.watchPercentage, 0);

  return Math.round(totalWatched / totalChapters);
}

export function getLastWatchedChapter(): { chapterId: string; levelId: string } | null {
  const inProgressChapters = mockUserProgress
    .filter((p) => !p.completed)
    .sort((a, b) => b.lastWatchedAt.getTime() - a.lastWatchedAt.getTime());

  if (inProgressChapters.length > 0) {
    const chapterId = inProgressChapters[0].chapterId;
    const levelId = chapterId.startsWith("ch-1")
      ? "level-1"
      : chapterId.startsWith("ch-2")
        ? "level-2"
        : "level-3";
    return { chapterId, levelId };
  }

  // Find the first unwatched chapter
  const allChapterIds = [
    "ch-1-1", "ch-1-2", "ch-1-3", "ch-1-4", "ch-1-5",
    "ch-2-1", "ch-2-2", "ch-2-3", "ch-2-4", "ch-2-5", "ch-2-6",
  ];

  const watchedIds = new Set(mockUserProgress.filter((p) => p.completed).map((p) => p.chapterId));

  for (const chapterId of allChapterIds) {
    if (!watchedIds.has(chapterId)) {
      const levelId = chapterId.startsWith("ch-1") ? "level-1" : "level-2";
      return { chapterId, levelId };
    }
  }

  return null;
}
