import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch own notifications + unread count
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

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "15", 10),
      50
    );

    interface NotificationRow {
      id: string;
      type: string;
      title: string;
      body: string | null;
      link: string | null;
      is_read: boolean;
      created_at: string;
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit) as { data: NotificationRow[] | null; error: unknown };

    if (error) {
      console.error("Fetch notifications error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        isRead: n.is_read,
        createdAt: n.created_at,
      })),
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read ({ ids: [...] } or { all: true })
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

    const body = await request.json().catch(() => ({}));

    let query = supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      query = query.in("id", body.ids);
    } else if (body.all !== true) {
      return NextResponse.json(
        { error: "Provide ids or all: true" },
        { status: 400 }
      );
    }

    const { error } = await query;

    if (error) {
      console.error("Mark notifications read error:", error);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
