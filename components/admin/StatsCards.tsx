import { Card } from "@/components/ui";
import { Users, TrendingUp, CreditCard, Award } from "lucide-react";

const stats = [
  {
    label: "Ukupno studenata",
    value: "1,234",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    label: "Aktivnih ovaj tjedan",
    value: "456",
    change: "+5%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    label: "Prihod (mjesec)",
    value: "12,450 €",
    change: "+18%",
    changeType: "positive" as const,
    icon: CreditCard,
  },
  {
    label: "Stopa završetka",
    value: "67%",
    change: "-2%",
    changeType: "negative" as const,
    icon: Award,
  },
];

export function StatsCards() {
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
                <p
                  className={`text-sm mt-1 ${
                    stat.changeType === "positive"
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {stat.change} od prošlog mjeseca
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
