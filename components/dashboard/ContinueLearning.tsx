"use client";

import { useState, useEffect } from "react";
import { Card, Button, Progress } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Play, Clock, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface LastWatched {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEn?: string;
  levelId: string;
  levelNumber: number;
  levelTitle: string;
  lastPosition: number;
  watchPercentage: number;
  videoDuration: number;
  thumbnailUrl?: string;
  isNew: boolean;
}

export function ContinueLearning() {
  const [lastWatched, setLastWatched] = useState<LastWatched | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = useTranslations("dashboard.continueLearning");
  const tCourse = useTranslations("course");
  const locale = useLocale();

  useEffect(() => {
    const fetchLastWatched = async () => {
      try {
        const response = await fetch("/api/progress/last-watched");
        if (!response.ok) {
          // No progress yet is okay, don't show error
          if (response.status === 404) {
            setLastWatched(null);
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await response.json();
        setLastWatched(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLastWatched();
  }, []);

  if (loading) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </Card>
    );
  }

  if (error || !lastWatched) {
    return null;
  }

  const levelName =
    lastWatched.levelNumber === 1
      ? tCourse("level1")
      : lastWatched.levelNumber === 2
        ? tCourse("level2")
        : tCourse("level3");

  const chapterTitle =
    locale === "en" && lastWatched.chapterTitleEn
      ? lastWatched.chapterTitleEn
      : lastWatched.chapterTitle;

  const progressPercent = Math.round(lastWatched.watchPercentage);

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail */}
        <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {lastWatched.thumbnailUrl ? (
            <img
              src={lastWatched.thumbnailUrl}
              alt={chapterTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="h-10 w-10 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-xs text-secondary font-medium mb-1">
            {levelName} · {t("chapter")} {lastWatched.chapterNumber}
          </p>
          <h3 className="text-lg font-heading font-semibold text-primary mb-2">
            {chapterTitle}
          </h3>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(lastWatched.videoDuration)}</span>
            </div>
            <Progress value={progressPercent} size="sm" className="flex-1 max-w-32" />
            <span className="text-sm text-gray-500">{progressPercent}%</span>
          </div>

          <Link href={`/tecaj/${lastWatched.levelId}/${lastWatched.chapterId}`}>
            <Button leftIcon={<Play className="h-4 w-4" />}>
              {lastWatched.isNew || progressPercent === 0
                ? t("startButton")
                : t("continueButton")}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
