"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { mockLevels } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Video,
} from "lucide-react";

export function CourseEditor() {
  const [expandedLevels, setExpandedLevels] = useState<string[]>(["level-1"]);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) =>
      prev.includes(levelId)
        ? prev.filter((id) => id !== levelId)
        : [...prev, levelId]
    );
  };

  return (
    <div className="space-y-4">
      {mockLevels.map((level) => {
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
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
                      <p className="text-sm text-gray-500">
                        {formatDuration(chapter.videoDuration)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add chapter button */}
                <div className="p-4">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj poglavlje
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Add new level */}
      <Button variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Dodaj novu razinu
      </Button>
    </div>
  );
}
