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
  requiresPhotos?: boolean; // practical chapters require a photo submission
}

export type ChapterState =
  | "locked"
  | "available"
  | "in_progress"
  | "awaiting_photos" // watched, photo set not yet submitted
  | "photos_in_review" // photo set submitted, waiting for review
  | "redo_requested" // reviewer asked for new photos
  | "completed";

export interface ChapterStatus {
  chapterId: string;
  state: ChapterState;
  watchPercentage: number;
}

export type PhotoSubmissionStatus = "pending" | "approved" | "redo_requested";

export interface PhotoSubmission {
  id: string;
  chapterId?: string;
  attemptNumber: number;
  photoFrontUrl: string | null;
  photoLeftUrl: string | null;
  photoRightUrl: string | null;
  status: PhotoSubmissionStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}
