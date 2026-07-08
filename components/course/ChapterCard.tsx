import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { Lock, Play, CheckCircle2, Clock } from "lucide-react";
import type { Chapter, ChapterStatus } from "@/lib/types";

interface ChapterCardProps {
  chapter: Chapter;
  status: ChapterStatus;
  levelId: string;
  isActive: boolean;
}

export function ChapterCard({
  chapter,
  status,
  levelId,
  isActive,
}: ChapterCardProps) {
  const isLocked = status.state === "locked";
  const isCompleted = status.state === "completed";
  const isInProgress = status.state === "in_progress";

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        isActive && "bg-secondary/10 border border-secondary/20",
        !isActive && !isLocked && "hover:bg-gray-50",
        isLocked && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Status icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isCompleted && "bg-success/10 text-success",
          isInProgress && "bg-secondary/10 text-secondary",
          status.state === "available" && "bg-gray-100 text-gray-400",
          isLocked && "bg-gray-100 text-gray-300"
        )}
      >
        {isLocked ? (
          <Lock className="h-4 w-4" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isActive ? (
          <Play className="h-4 w-4" />
        ) : (
          <span className="text-sm font-medium">{chapter.chapterNumber}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-secondary" : "text-primary"
          )}
        >
          {chapter.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {formatDuration(chapter.videoDuration)}
          </span>
          {isInProgress && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-secondary">
                {status.watchPercentage}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return content;
  }

  return (
    <Link href={`/tecaj/${levelId}/${chapter.id}`}>
      {content}
    </Link>
  );
}
