import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(1).max(5000),
});

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
}

// GET - Own tickets, newest activity first, with unread admin-message counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("id, subject, status, created_at, last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false }) as {
        data: TicketRow[] | null;
        error: unknown;
      };

    if (error) {
      console.error("Fetch tickets error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    // Unread = admin messages not yet read by the student
    const { data: unreadRows } = await supabase
      .from("ticket_messages")
      .select("ticket_id")
      .eq("sender_role", "admin")
      .is("read_at", null)
      .in("ticket_id", (tickets || []).map((t) => t.id)) as {
        data: Array<{ ticket_id: string }> | null;
      };

    const unreadByTicket: Record<string, number> = {};
    for (const row of unreadRows || []) {
      unreadByTicket[row.ticket_id] =
        (unreadByTicket[row.ticket_id] || 0) + 1;
    }

    return NextResponse.json({
      tickets: (tickets || []).map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
        lastMessageAt: ticket.last_message_at,
        unreadCount: unreadByTicket[ticket.id] || 0,
      })),
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Open a new ticket with the first message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { subject, message } = validation.data;

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        subject,
        status: "open",
        created_by: "student",
      } as never)
      .select("id, subject, status, created_at")
      .single() as {
        data: { id: string; subject: string; status: string; created_at: string } | null;
        error: unknown;
      };

    if (ticketError || !ticket) {
      console.error("Create ticket error:", ticketError);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    const { error: messageError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: "student",
        body: message,
      } as never);

    if (messageError) {
      console.error("Create ticket message error:", messageError);
      return NextResponse.json(
        { error: "Failed to create ticket message" },
        { status: 500 }
      );
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
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
