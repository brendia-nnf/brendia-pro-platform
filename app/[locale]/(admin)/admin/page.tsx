"use client";

import { useEffect, useState } from "react";
import { Container, Card, CardHeader, CardTitle } from "@/components/ui";
import { StatsCards, CertificationQueue } from "@/components/admin";
import { Users, BookOpen, Award, TrendingUp, ShoppingBag } from "lucide-react";

interface RecentStudent {
  id: string;
  fullName: string;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        // Fetch recent students
        const studentsRes = await fetch("/api/admin/students?limit=3");
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setRecentStudents(data.students || []);
        }

        // Fetch recent orders
        const ordersRes = await fetch("/api/admin/orders?limit=3");
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setRecentOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentActivity();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Prije ${diffMins} min`;
    if (diffHours < 24) return `Prije ${diffHours} h`;
    return `Prije ${diffDays} dana`;
  };

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
              {loading ? (
                <p className="text-sm text-gray-500">Učitavanje...</p>
              ) : (
                <>
                  {recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-primary">
                          Nova registracija: {student.fullName || "Nepoznato"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatTimeAgo(student.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-primary">
                          Nova narudžba: {order.customerName} - {order.total.toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatTimeAgo(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentStudents.length === 0 && recentOrders.length === 0 && (
                    <p className="text-sm text-gray-500">Nema nedavne aktivnosti</p>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Certification queue */}
          <CertificationQueue />
        </div>
      </div>
    </Container>
  );
}
