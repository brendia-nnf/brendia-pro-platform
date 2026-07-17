import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageNotification } from "@/lib/email/send";

const createTicketSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(1).max(5000),
});

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  return { user, isAdmin: profile?.role === "admin" };
}

// GET - All tickets with student info and unread student-message counts
export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const statusFilter = request.nextUrl.searchParams.get("status");

    interface TicketRow {
      id: string;
      user_id: string;
      subject: string;
      status: string;
      created_at: string;
      last_message_at: string;
    }

    const admin = createAdminClient();
    let query = admin
      .from("tickets")
      .select("id, user_id, subject, status, created_at, last_message_at")
      .order("last_message_at", { ascending: false });

    if (statusFilter && ["open", "answered", "closed"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: tickets, error } = await query as unknown as {
      data: TicketRow[] | null;
      error: unknown;
    };

    if (error) {
      console.error("Fetch admin tickets error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    const ticketIds = (tickets || []).map((t) => t.id);
    const userIds = [...new Set((tickets || []).map((t) => t.user_id))];

    // Student names
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds) as {
        data: Array<{ id: string; full_name: string | null }> | null;
      };
    const nameById = new Map(
      (profiles || []).map((p) => [p.id, p.full_name || ""])
    );

    // Unread = student messages not yet read by an admin
    const { data: unreadRows } = ticketIds.length
      ? await admin
          .from("ticket_messages")
          .select("ticket_id")
          .eq("sender_role", "student")
          .is("read_at", null)
          .in("ticket_id", ticketIds) as {
            data: Array<{ ticket_id: string }> | null;
          }
      : { data: [] as Array<{ ticket_id: string }> };

    const unreadByTicket: Record<string, number> = {};
    for (const row of unreadRows || []) {
      unreadByTicket[row.ticket_id] = (unreadByTicket[row.ticket_id] || 0) + 1;
    }

    return NextResponse.json({
      tickets: (tickets || []).map((ticket) => ({
        id: ticket.id,
        userId: ticket.user_id,
        studentName: nameById.get(ticket.user_id) || "",
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
        lastMessageAt: ticket.last_message_at,
        unreadCount: unreadByTicket[ticket.id] || 0,
      })),
    });
  } catch (error) {
    console.error("Get admin tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Admin opens a new conversation with a student
export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, subject, message } = validation.data;
    const admin = createAdminClient();

    const { data: ticket, error: ticketError } = await admin
      .from("tickets")
      .insert({
        user_id: userId,
        subject,
        status: "answered",
        created_by: "admin",
      } as never)
      .select("id, subject, status, created_at")
      .single() as {
        data: { id: string; subject: string; status: string; created_at: string } | null;
        error: unknown;
      };

    if (ticketError || !ticket) {
      console.error("Create admin ticket error:", ticketError);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    const { error: messageError } = await admin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: "admin",
      body: message,
    } as never);

    if (messageError) {
      console.error("Create admin ticket message error:", messageError);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    // In-app + email notification for the student
    await createNotification({
      userId,
      type: "message",
      title: "Nova poruka od Brendia Pro tima",
      body: subject,
      link: `/poruke/${ticket.id}`,
    });

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single() as { data: { full_name: string | null } | null };

      if (authUser?.user?.email) {
        await sendNewMessageNotification(
          authUser.user.email,
          profile?.full_name || "",
          subject
        );
      }
    } catch (emailError) {
      console.error("New message email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
      },
    });
  } catch (error) {
    console.error("Create admin ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
