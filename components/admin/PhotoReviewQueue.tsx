"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button, Avatar, Modal, ModalFooter } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle,
  RotateCcw,
  RefreshCw,
  Loader2,
  Camera,
} from "lucide-react";

interface PhotoSubmissionItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber?: number;
  levelNumber?: number;
  attemptNumber: number;
  photoFrontUrl: string | null;
  photoLeftUrl: string | null;
  photoRightUrl: string | null;
  status: "pending" | "approved" | "redo_requested";
  feedback: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

interface PhotoReviewQueueProps {
  status: "pending" | "approved" | "redo_requested";
}

const STATUS_BADGES: Record<
  PhotoSubmissionItem["status"],
  { label: string; variant: "secondary" | "success" | "error" }
> = {
  pending: { label: "Na pregledu", variant: "secondary" },
  approved: { label: "Odobreno", variant: "success" },
  redo_requested: { label: "Dorada", variant: "error" },
};

export function PhotoReviewQueue({ status }: PhotoReviewQueueProps) {
  const [submissions, setSubmissions] = useState<PhotoSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PhotoSubmissionItem | null>(null);
  const [history, setHistory] = useState<PhotoSubmissionItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/photo-submissions?status=${status}`);
      if (!response.ok) {
        throw new Error("Failed to fetch photo submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openReview = async (submission: PhotoSubmissionItem) => {
    setSelected(submission);
    setFeedback("");
    setHistory([]);

    // Load previous attempts for context
    if (submission.attemptNumber > 1) {
      try {
        const response = await fetch(
          `/api/admin/photo-submissions?status=all&userId=${submission.userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const previous = (data.submissions || []).filter(
            (s: PhotoSubmissionItem) =>
              s.chapterId === submission.chapterId && s.id !== submission.id
          );
          setHistory(previous);
        }
      } catch {
        // History is optional context; ignore failures
      }
    }
  };

  const closeReview = () => {
    setSelected(null);
    setHistory([]);
    setFeedback("");
  };

  const handleReview = async (action: "approve" | "redo") => {
    if (!selected) return;
    if (action === "redo" && !feedback.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/photo-submissions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to review submission");
      }

      closeReview();
      await fetchSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to review submission");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          <span className="ml-2 text-gray-500">Učitavanje...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchSubmissions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovo
          </Button>
        </div>
      </Card>
    );
  }

  const photoTriplet = (submission: PhotoSubmissionItem) => [
    { label: "Sprijeda", url: submission.photoFrontUrl },
    { label: "Lijeva strana", url: submission.photoLeftUrl },
    { label: "Desna strana", url: submission.photoRightUrl },
  ];

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">
              {status === "pending"
                ? "Radovi na čekanju"
                : status === "approved"
                  ? "Odobreni radovi"
                  : "Zatražene dorade"}
            </h3>
            <p className="text-sm text-gray-500">
              {submissions.length}{" "}
              {status === "pending" ? "radova čeka pregled" : "radova"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchSubmissions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="divide-y divide-gray-50">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={submission.userName} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-primary truncate">
                    {submission.userName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    Razina {submission.levelNumber} · Poglavlje{" "}
                    {submission.chapterNumber}: {submission.chapterTitle}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Poslano: {formatDate(new Date(submission.submittedAt))}
                    {submission.attemptNumber > 1 &&
                      ` · ${submission.attemptNumber}. pokušaj`}
                  </p>
                </div>
              </div>

              {/* Photo thumbnails */}
              <div className="flex gap-2">
                {photoTriplet(submission).map((photo) => (
                  <div
                    key={photo.label}
                    className="w-14 h-[4.5rem] rounded-md overflow-hidden bg-gray-100 flex-shrink-0"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={STATUS_BADGES[submission.status].variant} size="sm">
                  {STATUS_BADGES[submission.status].label}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReview(submission)}
                >
                  Pregledaj
                </Button>
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {status === "pending"
                ? "Nema radova na čekanju."
                : "Nema radova u ovoj kategoriji."}
            </div>
          )}
        </div>
      </Card>

      {/* Review modal */}
      <Modal
        isOpen={!!selected}
        onClose={closeReview}
        size="lg"
        title={selected ? `${selected.userName} · ${selected.chapterTitle}` : ""}
        description={
          selected
            ? `Razina ${selected.levelNumber} · Poglavlje ${selected.chapterNumber} · ${selected.attemptNumber}. pokušaj`
            : ""
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Current photos side by side */}
            <div className="grid grid-cols-3 gap-3">
              {photoTriplet(selected).map((photo) => (
                <div key={photo.label}>
                  <a
                    href={photo.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-[3/4] rounded-lg overflow-hidden bg-gray-100"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </a>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {photo.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Previous attempts */}
            {history.length > 0 && (
              <div>
                <p className="text-sm font-medium text-primary mb-2">
                  Prethodni pokušaji
                </p>
                <div className="space-y-3">
                  {history.map((attempt) => (
                    <div key={attempt.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          {attempt.attemptNumber}. pokušaj ·{" "}
                          {formatDate(new Date(attempt.submittedAt))}
                        </p>
                        <Badge
                          variant={STATUS_BADGES[attempt.status].variant}
                          size="sm"
                        >
                          {STATUS_BADGES[attempt.status].label}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {photoTriplet(attempt).map((photo) => (
                          <a
                            key={photo.label}
                            href={photo.url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="w-12 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0"
                          >
                            {photo.url && (
                              <img
                                src={photo.url}
                                alt={photo.label}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </a>
                        ))}
                      </div>
                      {attempt.feedback && (
                        <p className="text-xs text-gray-600 italic mt-2">
                          &bdquo;{attempt.feedback}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {selected.status !== "approved" && (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Povratna informacija
                  <span className="text-gray-400 font-normal">
                    {" "}
                    (obavezno za doradu)
                  </span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Npr. redovi su preblizu tjemenu, obratite pažnju na razmak..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                />
              </div>
            )}

            {selected.status !== "approved" && (
              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => handleReview("redo")}
                  disabled={!feedback.trim() || processing}
                  className="text-error border-error/30 hover:bg-error/10"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Zatraži doradu
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Odobri rad
                </Button>
              </ModalFooter>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
