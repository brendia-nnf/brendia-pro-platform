import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageNotification } from "@/lib/email/send";

const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

const statusSchema = z.object({
  status: z.enum(["open", "answered", "closed"]),
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

interface TicketRow {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
}

// GET - Ticket thread with student info; marks student messages read
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: ticketId } = await params;
    const admin = createAdminClient();

    const { data: ticket } = await admin
      .from("tickets")
      .select("id, user_id, subject, status, created_at, last_message_at")
      .eq("id", ticketId)
      .single() as { data: TicketRow | null };

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.user_id)
      .single() as { data: { full_name: string | null } | null };

    const { data: authUser } = await admin.auth.admin.getUserById(
      ticket.user_id
    );

    const { data: messages } = await admin
      .from("ticket_messages")
      .select("id, sender_role, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }) as {
        data: Array<{
          id: string;
          sender_role: string;
          body: string;
          created_at: string;
        }> | null;
      };

    // Mark student messages as read by the admin
    await admin
      .from("ticket_messages")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("ticket_id", ticketId)
      .eq("sender_role", "student")
      .is("read_at", null);

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        userId: ticket.user_id,
        studentName: profile?.full_name || "",
        studentEmail: authUser?.user?.email || "",
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
        lastMessageAt: ticket.last_message_at,
      },
      messages: (messages || []).map((message) => ({
        id: message.id,
        senderRole: message.sender_role,
        body: message.body,
        createdAt: message.created_at,
      })),
    });
  } catch (error) {
    console.error("Get admin ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Admin reply; sets status to answered, notifies the student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const validation = replySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: ticket } = await admin
      .from("tickets")
      .select("id, user_id, subject")
      .eq("id", ticketId)
      .single() as {
        data: { id: string; user_id: string; subject: string } | null;
      };

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: message, error: messageError } = await admin
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: "admin",
        body: validation.data.message,
      } as never)
      .select("id, body, created_at")
      .single() as {
        data: { id: string; body: string; created_at: string } | null;
        error: unknown;
      };

    if (messageError || !message) {
      console.error("Create admin reply error:", messageError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    await admin
      .from("tickets")
      .update({
        status: "answered",
        last_message_at: new Date().toISOString(),
      } as never)
      .eq("id", ticketId);

    await createNotification({
      userId: ticket.user_id,
      type: "message",
      title: "Nova poruka od Brendia Pro tima",
      body: ticket.subject,
      link: `/poruke/${ticketId}`,
    });

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(
        ticket.user_id
      );
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", ticket.user_id)
        .single() as { data: { full_name: string | null } | null };

      if (authUser?.user?.email) {
        await sendNewMessageNotification(
          authUser.user.email,
          profile?.full_name || "",
          ticket.subject
        );
      }
    } catch (emailError) {
      console.error("New message email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderRole: "admin",
        body: message.body,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Change ticket status (close/reopen)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const validation = statusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: ticket, error } = await admin
      .from("tickets")
      .update({ status: validation.data.status } as never)
      .eq("id", ticketId)
      .select("id, status")
      .single() as {
        data: { id: string; status: string } | null;
        error: unknown;
      };

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Update ticket status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
