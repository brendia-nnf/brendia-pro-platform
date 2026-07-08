"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { Users, TrendingUp, CreditCard, Award } from "lucide-react";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeEnrollments: number;
    newStudents: number;
    studentsWithProgress: number;
  };
  revenue: {
    totalRevenue: number;
    currency: string;
  };
  courses: {
    avgCompletionRate: number;
  };
  certifications: {
    pending: number;
  };
}

export function StatsCards() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/admin/analytics?days=30");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const stats = [
    {
      label: "Ukupno studenata",
      value: loading ? "..." : data?.overview.totalStudents.toString() || "0",
      subtitle: `${data?.overview.newStudents || 0} novih ovaj mjesec`,
      icon: Users,
    },
    {
      label: "Aktivne prijave",
      value: loading ? "..." : data?.overview.activeEnrollments.toString() || "0",
      subtitle: `${data?.overview.studentsWithProgress || 0} aktivno uči`,
      icon: TrendingUp,
    },
    {
      label: "Prihod (mjesec)",
      value: loading ? "..." : `${data?.revenue.totalRevenue.toLocaleString() || 0} €`,
      subtitle: "Ukupni prihod",
      icon: CreditCard,
    },
    {
      label: "Stopa završetka",
      value: loading ? "..." : `${data?.courses.avgCompletionRate || 0}%`,
      subtitle: `${data?.certifications.pending || 0} čeka certifikat`,
      icon: Award,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm mt-1 text-gray-500">
                  {stat.subtitle}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
