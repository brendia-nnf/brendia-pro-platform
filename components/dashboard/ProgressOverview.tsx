"use client";

import { useProgress } from "@/hooks/useProgress";
import { Card, CardHeader, CardTitle, Progress, Badge, Button } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { BookOpen, CheckCircle2 } from "lucide-react";

export function ProgressOverview() {
  const { getLevelProgress } = useProgress();
  const t = useTranslations("dashboard.progress");

  const levels = [
    {
      id: "level-1",
      title: t("level1Title"),
      description: t("level1Description"),
      href: "/tecaj/level-1/ch-1-1",
      progress: getLevelProgress("level-1"),
    },
    {
      id: "level-2",
      title: t("level2Title"),
      description: t("level2Description"),
      href: "/tecaj/level-2/ch-2-1",
      progress: getLevelProgress("level-2"),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {levels.map((level) => {
        const isCompleted = level.progress === 100;
        const isStarted = level.progress > 0;

        return (
          <Card key={level.id} variant="default" padding="lg">
            <CardHeader className="mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCompleted
                        ? "bg-success/10 text-success"
                        : "bg-secondary/10 text-secondary"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{level.title}</CardTitle>
                  </div>
                </div>
                <Badge
                  variant={isCompleted ? "success" : isStarted ? "warning" : "outline"}
                  size="sm"
                >
                  {isCompleted ? t("completed") : isStarted ? t("inProgress") : t("notStarted")}
                </Badge>
              </div>
            </CardHeader>

            <p className="text-sm text-gray-600 mb-4">{level.description}</p>

            <Progress
              value={level.progress}
              size="md"
              variant={isCompleted ? "success" : "default"}
              showLabel
              className="mb-4"
            />

            <Link href={level.href}>
              <Button
                variant={isCompleted ? "outline" : "primary"}
                className="w-full"
              >
                {isCompleted
                  ? t("reviewAgain")
                  : isStarted
                    ? t("continueLesson")
                    : t("start")}
              </Button>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
