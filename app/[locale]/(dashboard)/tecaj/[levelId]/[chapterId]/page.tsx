"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container, Button, Card } from "@/components/ui";
import {
  VideoPlayer,
  ChapterSidebar,
  ProgressTracker,
  CompletionModal,
  PhotoSubmissionPanel,
} from "@/components/course";
import type { Chapter, ChapterStatus, ChapterState, PhotoSubmission } from "@/lib/types";
import { ChevronLeft, ChevronRight, Menu, Loader2 } from "lucide-react";

interface LevelChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  description: string | null;
  videoDuration: number;
  thumbnailUrl: string | null;
  requiresPhotos: boolean;
  photoStatus: string | null;
  state: ChapterState;
  watchPercentage: number;
}

interface LevelData {
  id: string;
  levelNumber: number;
  title: string;
  hasAccess: boolean;
  chapters: LevelChapterItem[];
  totalChapters: number;
  completedChapters: number;
}

interface ChapterData {
  id: string;
  levelId: string;
  chapterNumber: number;
  title: string;
  description: string | null;
  videoDuration: number | null;
  thumbnailUrl: string | null;
  requiresPhotos: boolean;
  hasAccess: boolean;
  videoUrl?: string;
  progress?: {
    watchPercentage: number;
    completed: boolean;
    lastPosition: number;
  };
  photoSubmission?: PhotoSubmission | null;
  previousChapter?: { id: string; title: string };
  nextChapter?: { id: string; title: string };
}

export default function CoursePlayerPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const chapterId = params.chapterId as string;

  const [level, setLevel] = useState<LevelData | null>(null);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [submission, setSubmission] = useState<PhotoSubmission | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const watchPercentageRef = useRef(0);

  const fetchLevel = useCallback(async () => {
    const response = await fetch(`/api/course/levels/${levelId}`);
    if (response.ok) {
      setLevel(await response.json());
    }
  }, [levelId]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [levelRes, chapterRes] = await Promise.all([
          fetch(`/api/course/levels/${levelId}`),
          fetch(`/api/course/levels/${levelId}/chapters/${chapterId}`),
        ]);

        if (cancelled) return;

        if (levelRes.ok) {
          setLevel(await levelRes.json());
        }

        if (chapterRes.ok) {
          const chapterData: ChapterData = await chapterRes.json();
          setChapter(chapterData);
          setSubmission(chapterData.photoSubmission || null);
          const initial = chapterData.progress?.watchPercentage || 0;
          setWatchPercentage(initial);
          watchPercentageRef.current = initial;
        } else {
          setChapter(null);
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
        if (!cancelled) setChapter(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [levelId, chapterId]);

  const handleProgress = useCallback(
    (percentage: number, position: number) => {
      const previous = watchPercentageRef.current;
      const next = Math.max(previous, Math.round(percentage));
      watchPercentageRef.current = next;
      setWatchPercentage(next);

      fetch(`/api/progress/${chapterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchPercentage: next,
          lastPosition: Math.round(position),
        }),
      }).catch((error) => console.error("Failed to save progress:", error));

      // Show completion modal when reaching 95%
      if (next >= 95 && previous < 95) {
        setShowCompletionModal(true);
        // Refresh sidebar states (chapter just completed)
        fetchLevel();
      }
    },
    [chapterId, fetchLevel]
  );

  const handleSubmitted = useCallback(
    (newSubmission: PhotoSubmission) => {
      setSubmission(newSubmission);
      // Refresh sidebar states (next chapter just unlocked)
      fetchLevel();
    },
    [fetchLevel]
  );

  const scrollToPhotos = useCallback(() => {
    document
      .getElementById("photo-submission")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

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

  const currentIndex = level.chapters.findIndex((ch) => ch.id === chapterId);
  const previousChapter = chapter.previousChapter;
  const nextChapter = chapter.nextChapter;

  const isCompleted = watchPercentage >= 95 || !!chapter.progress?.completed;
  const needsPhotos = chapter.requiresPhotos && !submission;
  const isNextEnabled = isCompleted && !needsPhotos && !!nextChapter;
  const isLevelComplete =
    isCompleted &&
    !needsPhotos &&
    !nextChapter &&
    currentIndex === level.chapters.length - 1;

  const levelName = `Razina ${level.levelNumber}`;
  const levelProgress =
    level.totalChapters > 0
      ? Math.round((level.completedChapters / level.totalChapters) * 100)
      : 0;

  // Map API chapters to sidebar props
  const sidebarChapters: Chapter[] = level.chapters.map((ch) => ({
    id: ch.id,
    levelId: level.id,
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    description: ch.description || "",
    videoDuration: ch.videoDuration,
    thumbnailUrl: ch.thumbnailUrl || "",
    requiresPhotos: ch.requiresPhotos,
  }));

  const sidebarStatuses: ChapterStatus[] = level.chapters.map((ch) => ({
    chapterId: ch.id,
    state: ch.id === chapterId && ch.state === "available" ? "in_progress" : ch.state,
    watchPercentage: ch.watchPercentage,
  }));

  const nextDisabledHint = !isCompleted
    ? "Pogledajte 95% videa za nastavak"
    : needsPhotos
      ? "Pošaljite fotografije rada za nastavak"
      : undefined;

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
          {level.chapters[0] && (
            <>
              <Link
                href={`/tecaj/${levelId}/${level.chapters[0].id}`}
                className="hover:text-primary transition-colors"
              >
                {levelName}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </>
          )}
          <span className="text-primary font-medium">
            Poglavlje {chapter.chapterNumber}
          </span>
        </nav>

        {/* Video player */}
        <VideoPlayer
          title={chapter.title}
          videoUrl={chapter.videoUrl}
          thumbnailUrl={chapter.thumbnailUrl || undefined}
          duration={chapter.videoDuration || 0}
          initialPosition={chapter.progress?.lastPosition || 0}
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
                <Button size="sm" disabled={!isNextEnabled} title={nextDisabledHint}>
                  Sljedeće poglavlje
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Photo submission (practical chapters only) */}
        {chapter.requiresPhotos && (
          <PhotoSubmissionPanel
            chapterId={chapter.id}
            submission={submission}
            isChapterWatched={isCompleted}
            onSubmitted={handleSubmitted}
          />
        )}
      </div>

      {/* Chapter sidebar */}
      <ChapterSidebar
        levelId={level.id}
        levelTitle={level.title}
        levelProgress={levelProgress}
        chapters={sidebarChapters}
        statuses={sidebarStatuses}
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
        requiresPhotos={chapter.requiresPhotos}
        hasSubmission={!!submission}
        onGoToPhotos={scrollToPhotos}
      />
    </div>
  );
}
