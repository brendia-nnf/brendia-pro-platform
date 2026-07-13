"use client";

import { useRef, useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PhotoSubmission } from "@/lib/types";
import {
  Camera,
  CheckCircle2,
  Hourglass,
  Loader2,
  MessageCircle,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

type Angle = "front" | "left" | "right";

const ANGLES: Array<{ key: Angle; label: string; hint: string }> = [
  { key: "front", label: "Sprijeda", hint: "Cijela glava, kosa spuštena" },
  { key: "left", label: "Lijeva strana", hint: "Profil s lijeve strane" },
  { key: "right", label: "Desna strana", hint: "Profil s desne strane" },
];

interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

interface PhotoSubmissionPanelProps {
  chapterId: string;
  submission: PhotoSubmission | null;
  isChapterWatched: boolean;
  onSubmitted: (submission: PhotoSubmission) => void;
  className?: string;
}

export function PhotoSubmissionPanel({
  chapterId,
  submission,
  isChapterWatched,
  onSubmitted,
  className,
}: PhotoSubmissionPanelProps) {
  const [uploads, setUploads] = useState<Partial<Record<Angle, UploadedPhoto>>>({});
  const [uploading, setUploading] = useState<Partial<Record<Angle, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Partial<Record<Angle, HTMLInputElement | null>>>({});

  const status = submission?.status || null;
  const canUpload =
    isChapterWatched && (status === null || status === "redo_requested");
  const allUploaded = ANGLES.every((a) => uploads[a.key]);

  const handleFileSelect = async (angle: Angle, file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading((prev) => ({ ...prev, [angle]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chapterId", chapterId);
      formData.append("angle", angle);

      const response = await fetch("/api/photo-submissions/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Učitavanje nije uspjelo");
      }

      setUploads((prev) => ({
        ...prev,
        [angle]: { path: data.path, previewUrl: data.url },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Učitavanje nije uspjelo");
    } finally {
      setUploading((prev) => ({ ...prev, [angle]: false }));
    }
  };

  const handleRemove = (angle: Angle) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[angle];
      return next;
    });
    const input = inputRefs.current[angle];
    if (input) input.value = "";
  };

  const handleSubmit = async () => {
    if (!allUploaded) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/photo-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          photoFrontPath: uploads.front!.path,
          photoLeftPath: uploads.left!.path,
          photoRightPath: uploads.right!.path,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Slanje nije uspjelo");
      }

      setUploads({});
      onSubmitted(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slanje nije uspjelo");
    } finally {
      setSubmitting(false);
    }
  };

  const submittedPhotos = submission
    ? [
        { label: "Sprijeda", url: submission.photoFrontUrl },
        { label: "Lijeva strana", url: submission.photoLeftUrl },
        { label: "Desna strana", url: submission.photoRightUrl },
      ]
    : [];

  return (
    <Card padding="lg" className={cn("mt-4", className)} id="photo-submission">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Camera className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-primary">
              Fotografije vašeg rada
            </h2>
            <p className="text-sm text-gray-500">
              Tri fotografije: sprijeda, s lijeve i desne strane
            </p>
          </div>
        </div>

        {status === "pending" && (
          <Badge variant="secondary" size="sm">
            Na pregledu
          </Badge>
        )}
        {status === "approved" && (
          <Badge variant="success" size="sm">
            Odobreno
          </Badge>
        )}
        {status === "redo_requested" && (
          <Badge variant="error" size="sm">
            Potrebna dorada
          </Badge>
        )}
      </div>

      {/* Not watched yet */}
      {!isChapterWatched && !submission && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          Nakon što pogledate video, primijenite tehniku na svom modelu i ovdje
          pošaljite tri fotografije rada. Time se otključava sljedeće poglavlje.
        </p>
      )}

      {/* Pending review */}
      {status === "pending" && (
        <div className="flex items-start gap-3 bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-4">
          <Hourglass className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Vaše fotografije su poslane i čekaju Nikolininu recenziju. Možete
            nastaviti sa sljedećim poglavljem dok čekate.
          </p>
        </div>
      )}

      {/* Approved */}
      {status === "approved" && (
        <div className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-lg p-4 mb-4">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p>Vaš rad je odobren. Odličan posao!</p>
            {submission?.feedback && (
              <p className="mt-2 italic">&bdquo;{submission.feedback}&rdquo;</p>
            )}
          </div>
        </div>
      )}

      {/* Redo requested with feedback */}
      {status === "redo_requested" && (
        <div className="flex items-start gap-3 bg-error/5 border border-error/20 rounded-lg p-4 mb-4">
          <MessageCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium text-primary mb-1">
              Nikolinina povratna informacija:
            </p>
            <p className="italic">&bdquo;{submission?.feedback}&rdquo;</p>
            <p className="mt-2">
              Primijenite povratnu informaciju i pošaljite nove fotografije.
            </p>
          </div>
        </div>
      )}

      {/* Submitted photos (pending/approved, or previous attempt on redo) */}
      {submission && (status === "pending" || status === "approved") && (
        <div className="grid grid-cols-3 gap-3">
          {submittedPhotos.map((photo) => (
            <div key={photo.label}>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                {photo.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upload slots */}
      {canUpload && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {ANGLES.map((angle) => {
              const upload = uploads[angle.key];
              const isUploading = uploading[angle.key];

              return (
                <div key={angle.key}>
                  <input
                    ref={(el) => {
                      inputRefs.current[angle.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) =>
                      handleFileSelect(angle.key, e.target.files?.[0] || null)
                    }
                  />

                  {upload ? (
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 group">
                      <img
                        src={upload.previewUrl}
                        alt={angle.label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemove(angle.key)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label={`Ukloni fotografiju: ${angle.label}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                        <p className="text-xs text-white font-medium">
                          {angle.label}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => inputRefs.current[angle.key]?.click()}
                      disabled={isUploading}
                      className={cn(
                        "w-full aspect-[3/4] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 p-3 transition-colors",
                        "hover:border-secondary/50 hover:bg-secondary/5",
                        isUploading && "opacity-70 cursor-wait"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-primary">
                        {angle.label}
                      </span>
                      <span className="text-xs text-gray-400 text-center">
                        {angle.hint}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-sm text-error mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              JPEG, PNG ili HEIC · najviše 10&nbsp;MB po fotografiji
            </p>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!allUploaded || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Slanje...
                </>
              ) : status === "redo_requested" ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Pošalji novi rad
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Pošalji rad
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
