"use client";

import { useProgress } from "@/hooks/useProgress";
import { Card, CardHeader, CardTitle, Progress, Badge, Button } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { BookOpen, CheckCircle2, Lock, Loader2 } from "lucide-react";

export function ProgressOverview() {
  const { levels, loading } = useProgress();
  const t = useTranslations("dashboard.progress");
  const locale = useLocale();

  if (loading) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </Card>
    );
  }

  if (levels.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {levels.map((level) => {
        const isCompleted = level.progressPercentage === 100;
        const isStarted = level.progressPercentage > 0;
        const title =
          locale === "en" && level.titleEn ? level.titleEn : level.title;
        const description =
          locale === "en" && level.descriptionEn
            ? level.descriptionEn
            : level.description;
        const href = level.firstChapterId
          ? `/tecaj/${level.id}/${level.firstChapterId}`
          : null;

        return (
          <Card key={level.id} variant="default" padding="lg">
            <CardHeader className="mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCompleted
                        ? "bg-success/10 text-success"
                        : level.isLocked
                          ? "bg-gray-100 text-gray-400"
                          : "bg-secondary/10 text-secondary"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : level.isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
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

            <p className="text-sm text-gray-600 mb-4">{description}</p>

            <Progress
              value={level.progressPercentage}
              size="md"
              variant={isCompleted ? "success" : "default"}
              showLabel
              className="mb-4"
            />

            {href && !level.isLocked ? (
              <Link href={href}>
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
            ) : (
              <Button variant="outline" className="w-full" disabled>
                <Lock className="h-4 w-4 mr-2" />
                {t("locked")}
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
