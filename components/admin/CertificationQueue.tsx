"use client";

import { useState } from "react";
import { Card, Badge, Button, Avatar, Modal, ModalFooter, Input } from "@/components/ui";
import { mockCertificationApplications } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import type { CertificationApplication } from "@/lib/types";

export function CertificationQueue() {
  const [applications, setApplications] = useState(mockCertificationApplications);
  const [selectedApp, setSelectedApp] = useState<CertificationApplication | null>(
    null
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (appId: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: "approved" as const } : app
      )
    );
  };

  const handleReject = () => {
    if (selectedApp) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id ? { ...app, status: "rejected" as const } : app
        )
      );
      setRejectModalOpen(false);
      setSelectedApp(null);
      setRejectReason("");
    }
  };

  const pendingApps = applications.filter(
    (app) => app.status === "applied" || app.status === "under_review"
  );

  return (
    <>
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-primary">Prijave na čekanju</h3>
          <p className="text-sm text-gray-500">
            {pendingApps.length} prijava čeka pregled
          </p>
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
                    Prijavljeno: {formatDate(app.appliedAt)}
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
                  className="text-success hover:bg-success/10"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApp(app);
                    setRejectModalOpen(true);
                  }}
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
          <Button variant="danger" onClick={handleReject}>
            Odbij prijavu
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
