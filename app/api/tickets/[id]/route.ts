import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

interface TicketRow {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

// GET - Ticket with full thread; marks admin messages as read
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, user_id, subject, status, created_at, last_message_at")
      .eq("id", ticketId)
      .eq("user_id", user.id)
      .single() as { data: TicketRow | null };

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("ticket_messages")
      .select("id, sender_role, body, created_at, read_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }) as {
        data: MessageRow[] | null;
        error: unknown;
      };

    if (messagesError) {
      console.error("Fetch ticket messages error:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Mark admin messages as read (RLS blocks students updating messages,
    // so use the admin client after the ownership check above)
    const admin = createAdminClient();
    await admin
      .from("ticket_messages")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("ticket_id", ticketId)
      .eq("sender_role", "admin")
      .is("read_at", null);

    return NextResponse.json({
      ticket: {
        id: ticket.id,
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
    console.error("Get ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Student reply; reopens answered/closed tickets
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = replySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, user_id, status")
      .eq("id", ticketId)
      .eq("user_id", user.id)
      .single() as { data: { id: string; user_id: string; status: string } | null };

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: message, error: messageError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: "student",
        body: validation.data.message,
      } as never)
      .select("id, body, created_at")
      .single() as {
        data: { id: string; body: string; created_at: string } | null;
        error: unknown;
      };

    if (messageError || !message) {
      console.error("Create reply error:", messageError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // A student reply always (re)opens the ticket
    const admin = createAdminClient();
    await admin
      .from("tickets")
      .update({
        status: "open",
        last_message_at: new Date().toISOString(),
      } as never)
      .eq("id", ticketId);

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderRole: "student",
        body: message.body,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error("Reply to ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
