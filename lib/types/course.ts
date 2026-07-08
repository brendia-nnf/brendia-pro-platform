export interface Level {
  id: string;
  levelNumber: 1 | 2 | 3;
  title: string;
  description: string;
  chapters: Chapter[];
  isLocked: boolean;
}

export interface Chapter {
  id: string;
  levelId: string;
  chapterNumber: number;
  title: string;
  description: string;
  videoDuration: number; // seconds
  thumbnailUrl: string;
  videoUrl?: string; // Will be Mux playback ID later
}

export interface ChapterStatus {
  chapterId: string;
  state: "locked" | "available" | "in_progress" | "completed";
  watchPercentage: number;
}
