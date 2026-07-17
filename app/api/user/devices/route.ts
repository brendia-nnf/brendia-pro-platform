import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const registerDeviceSchema = z.object({
  deviceName: z.string().min(1).max(100),
  deviceType: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
});

// POST - Register/refresh the calling device (used by the mobile app;
// the web registers via the register_device RPC on login)
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
    const validation = registerDeviceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    // register_device dedupes by user_agent and enforces the device limit
    const admin = createAdminClient();
    const { data: deviceId, error: rpcError } = await admin.rpc(
      "register_device",
      {
        p_user_id: user.id,
        p_device_name: validation.data.deviceName,
        p_device_type: validation.data.deviceType || "unknown",
        p_browser: validation.data.browser || null,
        p_os: validation.data.os || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      } as never
    );

    if (rpcError) {
      console.error("Register device error:", rpcError);
      return NextResponse.json(
        { error: "Failed to register device" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deviceId });
  } catch (error) {
    console.error("Register device error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    interface DeviceRow {
      id: string;
      device_name: string | null;
      device_type: string | null;
      browser: string | null;
      os: string | null;
      is_current: boolean;
      last_active: string;
      created_at: string;
    }

    const { data: devices, error: devicesError } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false }) as { data: DeviceRow[] | null; error: unknown };

    if (devicesError || !devices) {
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
