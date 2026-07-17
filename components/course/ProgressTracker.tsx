import { useTranslations } from "next-intl";
import { Progress, Badge } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

interface ProgressTrackerProps {
  watchPercentage: number;
  isCompleted: boolean;
}

export function ProgressTracker({
  watchPercentage,
  isCompleted,
}: ProgressTrackerProps) {
  const t = useTranslations("coursePlayer.progress");

  return (
    <div className="flex items-center gap-4">
      <Progress
        value={watchPercentage}
        size="sm"
        variant={isCompleted ? "success" : "default"}
        className="flex-1"
      />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">
          {watchPercentage}%
        </span>
        {isCompleted && (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("completed")}
          </Badge>
        )}
      </div>
    </div>
  );
}
