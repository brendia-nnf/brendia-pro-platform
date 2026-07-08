"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container, Button, Card } from "@/components/ui";
import {
  VideoPlayer,
  ChapterSidebar,
  ProgressTracker,
  CompletionModal,
} from "@/components/course";
import { useProgress } from "@/hooks/useProgress";
import { getLevelById, getChapterById } from "@/lib/mock-data/courses";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function CoursePlayerPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const chapterId = params.chapterId as string;

  const { getChapterStatuses, updateChapterProgress } = useProgress();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const level = getLevelById(levelId);
  const chapter = getChapterById(chapterId);
  const statuses = level ? getChapterStatuses(level.id) : [];

  // Get current chapter index and find next/previous chapters
  const currentIndex = level?.chapters.findIndex((ch) => ch.id === chapterId) ?? -1;
  const previousChapter = currentIndex > 0 ? level?.chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < (level?.chapters.length ?? 0) - 1
      ? level?.chapters[currentIndex + 1]
      : null;

  // Initialize watch percentage from progress
  useEffect(() => {
    if (chapterId) {
      const status = statuses.find((s) => s.chapterId === chapterId);
      if (status) {
        setWatchPercentage(status.watchPercentage);
      }
    }
  }, [chapterId, statuses]);

  const handleProgress = (percentage: number) => {
    setWatchPercentage(percentage);
    updateChapterProgress(chapterId, percentage);

    // Show completion modal when reaching 95%
    if (percentage >= 95 && watchPercentage < 95) {
      setShowCompletionModal(true);
    }
  };

  const isCompleted = watchPercentage >= 95;
  const isNextEnabled = isCompleted && nextChapter;
  const isLevelComplete =
    isCompleted && !nextChapter && currentIndex === (level?.chapters.length ?? 0) - 1;

  if (!level || !chapter) {
    return (
      <Container>
        <div className="text-center py-12">
          <h1 className="text-2xl font-heading font-semibold text-primary mb-2">
            Sadržaj nije pronađen
          </h1>
          <p className="text-gray-600 mb-4">
            Poglavlje koje tražite ne postoji.
          </p>
          <Link href="/dashboard">
            <Button>Natrag na pregled</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const levelName = level.levelNumber === 1 ? "Razina 1" : "Razina 2";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content */}
      <div className="flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Nadzorna ploča
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link
            href={`/tecaj/${levelId}/${level.chapters[0].id}`}
            className="hover:text-primary transition-colors"
          >
            {levelName}
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-primary font-medium">
            Poglavlje {chapter.chapterNumber}
          </span>
        </nav>

        {/* Video player */}
        <VideoPlayer
          title={chapter.title}
          thumbnailUrl={chapter.thumbnailUrl}
          watchPercentage={watchPercentage}
          onProgress={handleProgress}
        />

        {/* Chapter info */}
        <Card padding="lg" className="mt-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-secondary font-medium mb-1">
                {levelName} · Poglavlje {chapter.chapterNumber}
              </p>
              <h1 className="text-2xl font-heading font-semibold text-primary">
                {chapter.title}
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Otvori popis poglavlja"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">{chapter.description}</p>

          {/* Progress tracker */}
          <ProgressTracker
            watchPercentage={watchPercentage}
            isCompleted={isCompleted}
          />

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            {previousChapter ? (
              <Link href={`/tecaj/${levelId}/${previousChapter.id}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prethodno
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter && (
              <Link
                href={`/tecaj/${levelId}/${nextChapter.id}`}
                className={!isNextEnabled ? "pointer-events-none" : ""}
              >
                <Button
                  size="sm"
                  disabled={!isNextEnabled}
                  title={
                    !isNextEnabled
                      ? "Pogledajte 95% videa za nastavak"
                      : undefined
                  }
                >
                  Sljedeće poglavlje
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* Chapter sidebar */}
      <ChapterSidebar
        level={level}
        currentChapterId={chapterId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Completion modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        chapterTitle={chapter.title}
        nextChapterId={nextChapter?.id}
        nextChapterTitle={nextChapter?.title}
        levelId={levelId}
        isLevelComplete={isLevelComplete}
      />
    </div>
  );
}
