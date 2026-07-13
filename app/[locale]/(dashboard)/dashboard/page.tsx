"use client";

import { useProgress } from "@/hooks/useProgress";
import { Container, Card, Button } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  WelcomeCard,
  ProgressOverview,
  ContinueLearning,
  KitStatus,
} from "@/components/dashboard";
import { Award } from "lucide-react";

export default function DashboardPage() {
  const { isCertificationEligible } = useProgress();
  const t = useTranslations("dashboard");

  return (
    <Container size="xl">
      <div className="space-y-6">
        {/* Welcome section */}
        <WelcomeCard />

        {/* Continue learning */}
        <section>
          <h2 className="text-xl font-heading font-semibold text-primary mb-4">
            {t("continueLearning.title")}
          </h2>
          <ContinueLearning />
        </section>

        {/* Progress overview */}
        <section>
          <h2 className="text-xl font-heading font-semibold text-primary mb-4">
            {t("progress.title")}
          </h2>
          <ProgressOverview />
        </section>

        {/* Certification CTA - only show when eligible and not yet applied */}
        {isCertificationEligible && (
          <Card
            variant="elevated"
            padding="lg"
            className="bg-gradient-to-r from-secondary to-accent text-white"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-heading font-semibold mb-1">
                  {t("certification.congratulations")}
                </h3>
                <p className="text-white/90">
                  {t("certification.description")}
                </p>
              </div>
              <Link href="/certifikat">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-secondary"
                >
                  {t("certification.applyButton")}
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Kit status */}
        <section>
          <h2 className="text-xl font-heading font-semibold text-primary mb-4">
            {t("kit.title")}
          </h2>
          <KitStatus />
        </section>
      </div>
    </Container>
  );
}
