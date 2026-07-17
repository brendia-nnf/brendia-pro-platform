"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Badge, Button } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Loader2, ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  senderRole: "student" | "admin";
  body: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
}

const STATUS_VARIANTS = {
  open: "warning",
  answered: "success",
  closed: "default",
} as const;

export default function TicketPage() {
  const t = useTranslations("messages");
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setReply("");
        setTicket((prev) => (prev ? { ...prev, status: "open" } : prev));
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-gray-600 mb-4">{t("notFound")}</p>
        <Link href="/poruke" className="text-secondary hover:underline">
          {t("backToMessages")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/poruke"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToMessages")}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          {ticket.subject}
        </h1>
        <Badge variant={STATUS_VARIANTS[ticket.status]}>
          {t(`status.${ticket.status}`)}
        </Badge>
      </div>

      <Card className="p-5 mb-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderRole === "student"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.senderRole === "student"
                    ? "bg-secondary text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                <p className="text-xs opacity-70 mb-1">
                  {message.senderRole === "admin"
                    ? t("teamSender")
                    : t("youSender")}{" "}
                  ·{" "}
                  {new Date(message.createdAt).toLocaleDateString("hr-HR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      <form onSubmit={handleReply} className="flex gap-3">
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={t("replyPlaceholder")}
          rows={2}
          maxLength={5000}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary resize-none"
        />
        <Button type="submit" disabled={sending || !reply.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
