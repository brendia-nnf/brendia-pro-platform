"use client";

import { Container, Card, CardHeader, CardTitle } from "@/components/ui";
import { StatsCards, CertificationQueue } from "@/components/admin";
import { Users, BookOpen, Award, TrendingUp } from "lucide-react";

const recentActivity = [
  {
    id: 1,
    type: "signup",
    message: "Nova registracija: Petra Novak",
    time: "Prije 5 minuta",
    icon: Users,
  },
  {
    id: 2,
    type: "completion",
    message: "Ana Kovačević je završila Razinu 2",
    time: "Prije 1 sat",
    icon: Award,
  },
  {
    id: 3,
    type: "progress",
    message: "Marija Horvat je započela Razinu 1",
    time: "Prije 2 sata",
    icon: BookOpen,
  },
  {
    id: 4,
    type: "purchase",
    message: "Nova kupnja: Ivana Babić - Napredni paket",
    time: "Prije 3 sata",
    icon: TrendingUp,
  },
];

export default function AdminDashboardPage() {
  return (
    <Container size="xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-semibold text-primary">
          Administracija
        </h1>
        <p className="text-gray-600 mt-1">
          Pregled stanja i upravljanje platformom.
        </p>
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Nedavna aktivnost</CardTitle>
            </CardHeader>

            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-primary">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Certification queue */}
          <CertificationQueue />
        </div>
      </div>
    </Container>
  );
}
