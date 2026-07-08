"use client";

import { useState } from "react";
import { Card, Badge, Button, Input, Avatar } from "@/components/ui";
import { mockUsers } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Search, MoreVertical, Eye, Ban, CheckCircle } from "lucide-react";

export function StudentTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const students = mockUsers.filter((user) => user.role === "user");

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card padding="none">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Pretraži studente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="all">Svi statusi</option>
            <option value="active">Aktivni</option>
            <option value="expired">Istekli</option>
            <option value="cancelled">Otkazani</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Student
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Datum kupnje
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Paket
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Razina
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.fullName} size="sm" />
                    <div>
                      <p className="font-medium text-primary">
                        {student.fullName}
                      </p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(student.purchaseDate)}
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={
                      student.purchasePackage === "advanced"
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                  >
                    {student.purchasePackage === "advanced"
                      ? "Napredni"
                      : "Osnovni"}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  Razina {student.currentLevel}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge
                    variant={
                      student.subscriptionStatus === "active"
                        ? "success"
                        : student.subscriptionStatus === "expired"
                          ? "warning"
                          : "error"
                    }
                    size="sm"
                  >
                    {student.subscriptionStatus === "active"
                      ? "Aktivan"
                      : student.subscriptionStatus === "expired"
                        ? "Istekao"
                        : "Otkazan"}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nema pronađenih studenata.
        </div>
      )}

      {/* Pagination placeholder */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Prikazano {filteredStudents.length} od {students.length} studenata
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Prethodna
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sljedeća
          </Button>
        </div>
      </div>
    </Card>
  );
}
