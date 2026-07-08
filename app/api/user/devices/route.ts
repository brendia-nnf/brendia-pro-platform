import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch user devices
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

    const { data: devices, error: devicesError } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });

    if (devicesError) {
      console.error("Fetch devices error:", devicesError);
      return NextResponse.json(
        { error: "Failed to fetch devices" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      devices: devices.map((device) => ({
        id: device.id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        browser: device.browser,
        os: device.os,
        isCurrent: device.is_current,
        lastActive: device.last_active,
        createdAt: device.created_at,
      })),
    });
  } catch (error) {
    console.error("Get devices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
