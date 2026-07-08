// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// DELETE - Remove a device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify device belongs to user
    const { data: device } = await supabase
      .from("devices")
      .select("id, user_id, is_current")
      .eq("id", deviceId)
      .single();

    if (!device || device.user_id !== user.id) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Prevent deleting current device
    if (device.is_current) {
      return NextResponse.json(
        { error: "Cannot remove current device. Please log out instead." },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("devices")
      .delete()
      .eq("id", deviceId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to remove device" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete device error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
