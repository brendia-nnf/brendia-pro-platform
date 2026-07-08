"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Video,
  RefreshCw,
  Loader2,
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
  isLocked: boolean;
  lockReason?: string;
  chapters: Chapter[];
  totalChapters: number;
  completedChapters: number;
}

export function CourseEditor() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);

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
                {level.isLocked && (
                  <Badge variant="outline" size="sm">
                    Zaključano
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
                    // TODO: Open edit level modal
                  }}
                >
                  <Edit2 className="h-4 w-4" />
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

                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Video className="h-5 w-5 text-gray-400" />
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
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Open edit chapter modal
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Delete chapter with confirmation
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-error" />
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
                      // TODO: Open add chapter modal
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
