"use client";

import { useProgress } from "@/hooks/useProgress";
import { Card, Button, Progress } from "@/components/ui";
import { getChapterById } from "@/lib/mock-data/courses";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Play, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function ContinueLearning() {
  const { getLastWatched } = useProgress();
  const t = useTranslations("dashboard.continueLearning");
  const tCourse = useTranslations("course");

  const lastWatched = getLastWatched();

  if (!lastWatched) {
    return null;
  }

  const chapter = getChapterById(lastWatched.chapterId);

  if (!chapter) {
    return null;
  }

  const levelName = lastWatched.levelId === "level-1" ? tCourse("level1") : tCourse("level2");

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail placeholder */}
        <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <Play className="h-10 w-10 text-gray-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-xs text-secondary font-medium mb-1">
            {levelName} · {t("chapter")} {chapter.chapterNumber}
          </p>
          <h3 className="text-lg font-heading font-semibold text-primary mb-2">
            {chapter.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {chapter.description}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(chapter.videoDuration)}</span>
            </div>
            <Progress value={65} size="sm" className="flex-1 max-w-32" />
            <span className="text-sm text-gray-500">65%</span>
          </div>

          <Link href={`/tecaj/${lastWatched.levelId}/${lastWatched.chapterId}`}>
            <Button leftIcon={<Play className="h-4 w-4" />}>
              {t("continueButton")}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
