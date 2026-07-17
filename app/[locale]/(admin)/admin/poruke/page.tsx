"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button, Input } from "@/components/ui";
import {
  Loader2,
  MessageCircle,
  Plus,
  ChevronRight,
} from "lucide-react";

interface AdminTicket {
  id: string;
  userId: string;
  studentName: string;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface StudentOption {
  id: string;
  fullName: string | null;
  email: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Čeka odgovor",
  answered: "Odgovoreno",
  closed: "Zatvoreno",
};

const STATUS_VARIANTS = {
  open: "warning",
  answered: "success",
  closed: "default",
} as const;

const FILTERS = [
  { value: "", label: "Sve" },
  { value: "open", label: "Čeka odgovor" },
  { value: "answered", label: "Odgovoreno" },
  { value: "closed", label: "Zatvoreno" },
];

export default function AdminMessagesPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async (statusFilter: string) => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/admin/tickets${query}`);
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
    fetchTickets(filter);
  }, [filter]);

  useEffect(() => {
    if (!showForm || students.length > 0) return;
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/admin/students?limit=200");
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (fetchError) {
        console.error("Failed to fetch students:", fetchError);
      }
    };
    fetchStudents();
  }, [showForm, students.length]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudent || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent,
          subject,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Greška pri slanju poruke");
        return;
      }
      setSubject("");
      setMessage("");
      setSelectedStudent("");
      setShowForm(false);
      await fetchTickets(filter);
    } catch {
      setError("Greška pri slanju poruke");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary">
            Poruke
          </h1>
          <p className="text-gray-500 mt-1">
            Podrška i komunikacija sa studentima
          </p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova poruka
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Studentica
              </label>
              <select
                value={selectedStudent}
                onChange={(event) => setSelectedStudent(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary bg-white"
              >
                <option value="">Odaberite studenticu…</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName || student.email} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naslov
              </label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poruka
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
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
                Pošalji
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Odustani
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Nema poruka</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/admin/poruke/${ticket.id}`}>
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
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {ticket.studentName || "Nepoznata studentica"} ·{" "}
                      {new Date(ticket.lastMessageAt).toLocaleDateString(
                        "hr-HR",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
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
