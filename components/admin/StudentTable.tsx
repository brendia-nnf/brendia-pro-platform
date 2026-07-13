"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button, Input, Avatar, Modal, ModalFooter } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Search, MoreVertical, Eye, RefreshCw, Loader2, Package } from "lucide-react";

type KitStatusValue = "preparing" | "shipped" | "delivered";

interface Student {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  enrollment: {
    id: string;
    courseId: string;
    package: "basic" | "advanced";
    status: string;
    purchasedAt: string;
    expiresAt?: string;
    kitStatus: KitStatusValue;
    kitTrackingNumber?: string | null;
  } | null;
  certificationStatus: string;
}

const KIT_LABELS: Record<KitStatusValue, string> = {
  preparing: "U pripremi",
  shipped: "Poslan",
  delivered: "Dostavljen",
};

const KIT_BADGES: Record<KitStatusValue, "warning" | "secondary" | "success"> = {
  preparing: "warning",
  shipped: "secondary",
  delivered: "success",
};

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function StudentTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kitStudent, setKitStudent] = useState<Student | null>(null);
  const [kitStatusValue, setKitStatusValue] = useState<KitStatusValue>("preparing");
  const [kitTracking, setKitTracking] = useState("");
  const [savingKit, setSavingKit] = useState(false);

  const openKitModal = (student: Student) => {
    if (!student.enrollment) return;
    setKitStudent(student);
    setKitStatusValue(student.enrollment.kitStatus);
    setKitTracking(student.enrollment.kitTrackingNumber || "");
  };

  const closeKitModal = () => {
    setKitStudent(null);
    setKitTracking("");
  };

  const saveKitStatus = async () => {
    if (!kitStudent?.enrollment) return;
    setSavingKit(true);
    try {
      const response = await fetch(
        `/api/admin/enrollments/${kitStudent.enrollment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kitStatus: kitStatusValue,
            trackingNumber: kitTracking.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update kit status");
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.id === kitStudent.id && s.enrollment
            ? {
                ...s,
                enrollment: {
                  ...s.enrollment,
                  kitStatus: kitStatusValue,
                  kitTrackingNumber: kitTracking.trim() || null,
                },
              }
            : s
        )
      );
      closeKitModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update kit status");
    } finally {
      setSavingKit(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/students?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter]);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

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
          </select>
          <Button variant="ghost" size="sm" onClick={fetchStudents}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          <span className="ml-2 text-gray-500">Učitavanje...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchStudents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovo
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
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
                  Certifikacija
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Kit
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
              {students.map((student) => (
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
                    {student.enrollment
                      ? formatDate(new Date(student.enrollment.purchasedAt))
                      : "-"}
                  </td>
                  <td className="py-3 px-4">
                    {student.enrollment ? (
                      <Badge
                        variant={
                          student.enrollment.package === "advanced"
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                      >
                        {student.enrollment.package === "advanced"
                          ? "Napredni"
                          : "Osnovni"}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <Badge
                      variant={
                        student.certificationStatus === "approved"
                          ? "success"
                          : student.certificationStatus === "applied" ||
                              student.certificationStatus === "under_review"
                            ? "warning"
                            : "outline"
                      }
                      size="sm"
                    >
                      {student.certificationStatus === "approved"
                        ? "Certificiran"
                        : student.certificationStatus === "applied"
                          ? "Prijavljen"
                          : student.certificationStatus === "under_review"
                            ? "Na pregledu"
                            : "Nije prijavio"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {student.enrollment ? (
                      <button
                        onClick={() => openKitModal(student)}
                        className="inline-flex items-center gap-1.5 group"
                        title="Promijeni status kita"
                      >
                        <Badge
                          variant={KIT_BADGES[student.enrollment.kitStatus]}
                          size="sm"
                        >
                          {KIT_LABELS[student.enrollment.kitStatus]}
                        </Badge>
                        <Package className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        student.enrollment?.status === "active"
                          ? "success"
                          : student.enrollment?.status === "expired"
                            ? "warning"
                            : "error"
                      }
                      size="sm"
                    >
                      {student.enrollment?.status === "active"
                        ? "Aktivan"
                        : student.enrollment?.status === "expired"
                          ? "Istekao"
                          : student.enrollment
                            ? "Otkazan"
                            : "Nema upis"}
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
      )}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nema pronađenih studenata.
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && students.length > 0 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Prikazano {students.length} od {pagination.total} studenata
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={pagination.page <= 1}
            >
              Prethodna
            </Button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.totalPages}
            >
              Sljedeća
            </Button>
          </div>
        </div>
      )}

      {/* Kit status modal */}
      <Modal
        isOpen={!!kitStudent}
        onClose={closeKitModal}
        title="Status kita"
        description={
          kitStudent
            ? `Brendia Pro Kit za: ${kitStudent.fullName}`
            : ""
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Status
            </label>
            <select
              value={kitStatusValue}
              onChange={(e) => setKitStatusValue(e.target.value as KitStatusValue)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="preparing">U pripremi</option>
              <option value="shipped">Poslan</option>
              <option value="delivered">Dostavljen</option>
            </select>
          </div>

          <Input
            label="Broj za praćenje (opcionalno)"
            value={kitTracking}
            onChange={(e) => setKitTracking(e.target.value)}
            placeholder="npr. HP1234567890"
          />

          {kitStatusValue === "shipped" &&
            kitStudent?.enrollment?.kitStatus !== "shipped" && (
              <p className="text-sm text-gray-500">
                Studentu će biti poslan email s obavijesti o slanju kita.
              </p>
            )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={closeKitModal}>
            Odustani
          </Button>
          <Button onClick={saveKitStatus} disabled={savingKit}>
            {savingKit ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Spremi
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  );
}
