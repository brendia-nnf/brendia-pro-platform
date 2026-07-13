"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Modal, ModalFooter, Input } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Video,
  Camera,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  videoDuration: number;
  thumbnailUrl?: string;
  isPreview: boolean;
  isPublished?: boolean;
  requiresPhotos?: boolean;
  hasVideo?: boolean;
  state: string;
  watchPercentage: number;
}

interface Level {
  id: string;
  levelNumber: number;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  requiredPackage?: string;
  isPublished?: boolean;
  isLocked: boolean;
  lockReason?: string;
  chapters: Chapter[];
  totalChapters: number;
  completedChapters: number;
}

interface ChapterEditForm {
  title: string;
  titleEn: string;
  description: string;
  videoDuration: string; // minutes, as text input
  isPublished: boolean;
}

export function CourseEditor() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [togglingPhotos, setTogglingPhotos] = useState<string | null>(null);
  const [videoChapter, setVideoChapter] = useState<Chapter | null>(null);
  const [videoInput, setVideoInput] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [editForm, setEditForm] = useState<ChapterEditForm>({
    title: "",
    titleEn: "",
    description: "",
    videoDuration: "",
    isPublished: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingLevel, setTogglingLevel] = useState<string | null>(null);
  const [addLevel, setAddLevel] = useState<Level | null>(null);
  const [addForm, setAddForm] = useState<ChapterEditForm>({
    title: "",
    titleEn: "",
    description: "",
    videoDuration: "",
    isPublished: true,
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<string | null>(null);

  const saveNewChapter = async () => {
    if (!addLevel || !addForm.title.trim()) return;
    setSavingAdd(true);
    try {
      const durationMinutes = parseInt(addForm.videoDuration, 10);
      const response = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: addLevel.id,
          title: addForm.title.trim(),
          titleEn: addForm.titleEn.trim() || null,
          description: addForm.description.trim() || null,
          videoDuration: Number.isFinite(durationMinutes)
            ? Math.max(0, durationMinutes) * 60
            : 0,
          isPublished: addForm.isPublished,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create chapter");
      }

      setAddLevel(null);
      setAddForm({ title: "", titleEn: "", description: "", videoDuration: "", isPublished: true });
      await fetchLevels();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create chapter");
    } finally {
      setSavingAdd(false);
    }
  };

  const deleteChapter = async (chapter: Chapter) => {
    const confirmed = window.confirm(
      `Obrisati poglavlje "${chapter.title}"?\n\nOvo briše i sav napredak studenata te poslane fotografije za ovo poglavlje. Radnja se ne može poništiti.`
    );
    if (!confirmed) return;

    setDeletingChapter(chapter.id);
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete chapter");
      }

      setLevels((prev) =>
        prev.map((level) => ({
          ...level,
          chapters: level.chapters.filter((ch) => ch.id !== chapter.id),
        }))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete chapter");
    } finally {
      setDeletingChapter(null);
    }
  };

  const openEditModal = (chapter: Chapter) => {
    setEditChapter(chapter);
    setEditForm({
      title: chapter.title,
      titleEn: chapter.titleEn || "",
      description: chapter.description || "",
      videoDuration: String(Math.round(chapter.videoDuration / 60)),
      isPublished: chapter.isPublished !== false,
    });
  };

  const saveChapterEdit = async () => {
    if (!editChapter || !editForm.title.trim()) return;
    setSavingEdit(true);
    try {
      const durationMinutes = parseInt(editForm.videoDuration, 10);
      const response = await fetch(`/api/admin/chapters/${editChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          titleEn: editForm.titleEn.trim() || null,
          description: editForm.description.trim() || null,
          videoDuration: Number.isFinite(durationMinutes)
            ? Math.max(0, durationMinutes) * 60
            : undefined,
          isPublished: editForm.isPublished,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update chapter");
      }

      const data = await response.json();
      setLevels((prev) =>
        prev.map((level) => ({
          ...level,
          chapters: level.chapters.map((ch) =>
            ch.id === editChapter.id
              ? {
                  ...ch,
                  title: data.chapter.title,
                  titleEn: data.chapter.titleEn || undefined,
                  description: data.chapter.description || undefined,
                  videoDuration: data.chapter.videoDuration,
                  isPublished: data.chapter.isPublished,
                }
              : ch
          ),
        }))
      );
      setEditChapter(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update chapter");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleLevelPublished = async (level: Level) => {
    setTogglingLevel(level.id);
    try {
      const response = await fetch(`/api/admin/levels/${level.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !level.isPublished }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update level");
      }

      setLevels((prev) =>
        prev.map((l) =>
          l.id === level.id ? { ...l, isPublished: !level.isPublished } : l
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update level");
    } finally {
      setTogglingLevel(null);
    }
  };

  const saveVideo = async () => {
    if (!videoChapter) return;
    setSavingVideo(true);
    try {
      const response = await fetch(`/api/admin/chapters/${videoChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: videoInput.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update video");
      }

      const hasVideo = !!videoInput.trim();
      setLevels((prev) =>
        prev.map((level) => ({
          ...level,
          chapters: level.chapters.map((ch) =>
            ch.id === videoChapter.id ? { ...ch, hasVideo } : ch
          ),
        }))
      );
      setVideoChapter(null);
      setVideoInput("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update video");
    } finally {
      setSavingVideo(false);
    }
  };

  const toggleRequiresPhotos = async (chapter: Chapter) => {
    setTogglingPhotos(chapter.id);
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiresPhotos: !chapter.requiresPhotos }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update chapter");
      }

      setLevels((prev) =>
        prev.map((level) => ({
          ...level,
          chapters: level.chapters.map((ch) =>
            ch.id === chapter.id
              ? { ...ch, requiresPhotos: !chapter.requiresPhotos }
              : ch
          ),
        }))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update chapter");
    } finally {
      setTogglingPhotos(null);
    }
  };

  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/course/levels");
      if (!response.ok) {
        throw new Error("Failed to fetch levels");
      }

      const data = await response.json();
      setLevels(data.levels || []);

      // Expand first level by default
      if (data.levels?.length > 0 && expandedLevels.length === 0) {
        setExpandedLevels([data.levels[0].id]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [expandedLevels.length]);

  useEffect(() => {
    fetchLevels();
  }, []);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) =>
      prev.includes(levelId)
        ? prev.filter((id) => id !== levelId)
        : [...prev, levelId]
    );
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
          <Button onClick={fetchLevels} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Uređivanje tečaja</h2>
        <Button variant="ghost" size="sm" onClick={fetchLevels}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {levels.map((level) => {
        const isExpanded = expandedLevels.includes(level.id);

        return (
          <Card key={level.id} padding="none">
            {/* Level header */}
            <button
              onClick={() => toggleLevel(level.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-primary">{level.title}</h3>
                  <p className="text-sm text-gray-500">
                    {level.chapters.length} poglavlja
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {level.isPublished === false && (
                  <Badge variant="warning" size="sm">
                    Skriveno
                  </Badge>
                )}
                {level.requiredPackage === "advanced" && (
                  <Badge variant="secondary" size="sm">
                    Napredni paket
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLevelPublished(level);
                  }}
                  disabled={togglingLevel === level.id}
                  title={
                    level.isPublished === false
                      ? "Objavi razinu (vidljiva studentima)"
                      : "Sakrij razinu od studenata"
                  }
                >
                  {togglingLevel === level.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : level.isPublished === false ? (
                    <EyeOff className="h-4 w-4 text-warning" />
                  ) : (
                    <Eye className="h-4 w-4 text-success" />
                  )}
                </Button>
              </div>
            </button>

            {/* Chapters list */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {level.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />

                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        chapter.hasVideo
                          ? "bg-success/10"
                          : "bg-gray-100"
                      }`}
                    >
                      <Video
                        className={`h-5 w-5 ${
                          chapter.hasVideo ? "text-success" : "text-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-primary">
                        {chapter.chapterNumber}. {chapter.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatDuration(chapter.videoDuration)}</span>
                        {chapter.isPreview && (
                          <Badge variant="outline" size="sm">
                            Pregled
                          </Badge>
                        )}
                        {chapter.requiresPhotos && (
                          <Badge variant="secondary" size="sm">
                            Fotografije rada
                          </Badge>
                        )}
                        {!chapter.hasVideo && (
                          <Badge variant="warning" size="sm">
                            Bez videa
                          </Badge>
                        )}
                        {chapter.isPublished === false && (
                          <Badge variant="outline" size="sm">
                            Neobjavljeno
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVideoChapter(chapter);
                          setVideoInput("");
                        }}
                        title={
                          chapter.hasVideo
                            ? "Promijeni video (Mux playback ID)"
                            : "Dodaj video (Mux playback ID)"
                        }
                        className={
                          chapter.hasVideo ? "text-success hover:bg-success/10" : "text-gray-400"
                        }
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRequiresPhotos(chapter)}
                        disabled={togglingPhotos === chapter.id}
                        title={
                          chapter.requiresPhotos
                            ? "Isključi obavezne fotografije rada"
                            : "Uključi obavezne fotografije rada"
                        }
                        className={
                          chapter.requiresPhotos
                            ? "text-secondary hover:bg-secondary/10"
                            : "text-gray-400"
                        }
                      >
                        {togglingPhotos === chapter.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(chapter)}
                        title="Uredi poglavlje"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteChapter(chapter)}
                        disabled={deletingChapter === chapter.id}
                        title="Obriši poglavlje"
                      >
                        {deletingChapter === chapter.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-error" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                {level.chapters.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Nema poglavlja u ovoj razini.
                  </div>
                )}

                {/* Add chapter button */}
                <div className="p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setAddLevel(level);
                      setAddForm({
                        title: "",
                        titleEn: "",
                        description: "",
                        videoDuration: "",
                        isPublished: true,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj poglavlje
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {levels.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            Nema razina. Dodajte prvu razinu.
          </div>
        </Card>
      )}

      {/* Add chapter modal */}
      <Modal
        isOpen={!!addLevel}
        onClose={() => setAddLevel(null)}
        title={addLevel ? `Novo poglavlje: ${addLevel.title}` : ""}
      >
        <div className="space-y-4">
          <Input
            label="Naslov"
            value={addForm.title}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="npr. Priprema prirodne kose"
          />
          <Input
            label="Naslov (engleski)"
            value={addForm.titleEn}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, titleEn: e.target.value }))
            }
          />
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Opis
            </label>
            <textarea
              value={addForm.description}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            />
          </div>
          <Input
            label="Trajanje videa (minute)"
            type="number"
            value={addForm.videoDuration}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, videoDuration: e.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={addForm.isPublished}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, isPublished: e.target.checked }))
              }
              className="rounded border-gray-300 text-secondary focus:ring-secondary"
            />
            Objavljeno (vidljivo studentima)
          </label>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAddLevel(null)}>
            Odustani
          </Button>
          <Button
            onClick={saveNewChapter}
            disabled={savingAdd || !addForm.title.trim()}
          >
            {savingAdd ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Dodaj poglavlje
          </Button>
        </ModalFooter>
      </Modal>

      {/* Chapter edit modal */}
      <Modal
        isOpen={!!editChapter}
        onClose={() => setEditChapter(null)}
        title={editChapter ? `Uredi: ${editChapter.title}` : ""}
      >
        <div className="space-y-4">
          <Input
            label="Naslov"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Input
            label="Naslov (engleski)"
            value={editForm.titleEn}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, titleEn: e.target.value }))
            }
          />
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Opis
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            />
          </div>
          <Input
            label="Trajanje videa (minute)"
            type="number"
            value={editForm.videoDuration}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, videoDuration: e.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={editForm.isPublished}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  isPublished: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-secondary focus:ring-secondary"
            />
            Objavljeno (vidljivo studentima)
          </label>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setEditChapter(null)}>
            Odustani
          </Button>
          <Button
            onClick={saveChapterEdit}
            disabled={savingEdit || !editForm.title.trim()}
          >
            {savingEdit ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Spremi
          </Button>
        </ModalFooter>
      </Modal>

      {/* Video (Mux playback ID) modal */}
      <Modal
        isOpen={!!videoChapter}
        onClose={() => {
          setVideoChapter(null);
          setVideoInput("");
        }}
        title={videoChapter ? `Video: ${videoChapter.title}` : ""}
        description="Zalijepite Mux playback ID videa (ili direktni URL za testiranje). Ostavite prazno za uklanjanje videa."
      >
        <Input
          label="Mux playback ID"
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          placeholder="npr. DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
        />
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setVideoChapter(null);
              setVideoInput("");
            }}
          >
            Odustani
          </Button>
          <Button onClick={saveVideo} disabled={savingVideo}>
            {savingVideo ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Spremi
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add new level */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          // TODO: Open add level modal
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj novu razinu
      </Button>
    </div>
  );
}
