"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button, Avatar, Modal, ModalFooter, Input } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Eye, RefreshCw, Loader2 } from "lucide-react";

interface CertificationApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  status: "applied" | "under_review" | "approved" | "rejected";
  appliedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  certificateNumber?: string;
}

export function CertificationQueue() {
  const [applications, setApplications] = useState<CertificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<CertificationApplication | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/certifications?status=all");
      if (!response.ok) {
        throw new Error("Failed to fetch certifications");
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (appId: string) => {
    setProcessing(appId);
    try {
      const response = await fetch(`/api/admin/certifications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve");
      }

      // Refresh the list
      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve certification");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return;

    setProcessing(selectedApp.id);
    try {
      const response = await fetch(`/api/admin/certifications/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject");
      }

      setRejectModalOpen(false);
      setSelectedApp(null);
      setRejectReason("");
      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject certification");
    } finally {
      setProcessing(null);
    }
  };

  const pendingApps = applications.filter(
    (app) => app.status === "applied" || app.status === "under_review"
  );

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          <span className="ml-2 text-gray-500">Učitavanje...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchApplications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Prijave na čekanju</h3>
            <p className="text-sm text-gray-500">
              {pendingApps.length} prijava čeka pregled
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchApplications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="divide-y divide-gray-50">
          {pendingApps.map((app) => (
            <div
              key={app.id}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={app.userName} size="md" />
                <div>
                  <p className="font-medium text-primary">{app.userName}</p>
                  <p className="text-sm text-gray-500">{app.userEmail}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Prijavljeno: {app.appliedAt ? formatDate(new Date(app.appliedAt)) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={app.status === "under_review" ? "warning" : "secondary"}
                  size="sm"
                >
                  {app.status === "under_review" ? "Na pregledu" : "Nova"}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(app.id)}
                  disabled={processing === app.id}
                  className="text-success hover:bg-success/10"
                >
                  {processing === app.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApp(app);
                    setRejectModalOpen(true);
                  }}
                  disabled={processing === app.id}
                  className="text-error hover:bg-error/10"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {pendingApps.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nema prijava na čekanju.
            </div>
          )}
        </div>
      </Card>

      {/* Reject modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedApp(null);
          setRejectReason("");
        }}
        title="Odbij prijavu"
        description={`Odbijate prijavu za certifikaciju: ${selectedApp?.userName}`}
      >
        <Input
          label="Razlog odbijanja"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Unesite razlog odbijanja..."
        />
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setRejectModalOpen(false);
              setSelectedApp(null);
              setRejectReason("");
            }}
          >
            Odustani
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={!rejectReason.trim() || processing !== null}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Odbij prijavu
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
