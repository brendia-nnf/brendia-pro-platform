"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Input } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { Loader2, MessageCircle, Plus, ChevronRight } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  lastMessageAt: string;
  unreadCount: number;
}

const STATUS_VARIANTS = {
  open: "warning",
  answered: "success",
  closed: "default",
} as const;

export default function MessagesPage() {
  const t = useTranslations("messages");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (fetchError) {
      console.error("Failed to fetch tickets:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || t("createError"));
        return;
      }
      setSubject("");
      setMessage("");
      setShowForm(false);
      await fetchTickets();
    } catch {
      setError(t("createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary">
            {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newTicket")}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("subjectLabel")}
              </label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t("subjectPlaceholder")}
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("messageLabel")}
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={5}
                maxLength={5000}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t("send")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">{t("empty")}</p>
          <p className="text-gray-400 text-sm">{t("emptyHint")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/poruke/${ticket.id}`}>
              <Card className="p-5 mb-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-primary truncate">
                        {ticket.subject}
                      </span>
                      {ticket.unreadCount > 0 && (
                        <span className="h-5 min-w-5 px-1.5 bg-secondary text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {ticket.unreadCount}
                        </span>
                      )}
                      <Badge variant={STATUS_VARIANTS[ticket.status]}>
                        {t(`status.${ticket.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(new Date(ticket.lastMessageAt))}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
