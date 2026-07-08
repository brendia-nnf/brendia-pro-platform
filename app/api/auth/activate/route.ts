import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Course ID to package mapping
const COURSE_PACKAGES: Record<string, string> = {
  "foundation-certification": "basic",
  "master-certification": "advanced",
  "brendia-pro-artist-1v1": "basic",
  "brendia-pro-master-1v1": "advanced",
};

// GET: Validate token and return user info
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  interface OrderRow {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    course_id: string;
    course_name: string;
    order_number: string;
    enrollment_token_expires_at: string | null;
    enrollment_completed_at: string | null;
    status: string;
  }

  // Find order by enrollment token
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, email, first_name, last_name, course_id, course_name, order_number, enrollment_token_expires_at, enrollment_completed_at, status")
    .eq("enrollment_token", token)
    .single() as { data: OrderRow | null; error: unknown };

  if (error || !order) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 404 }
    );
  }

  // Check if order was paid
  if (order.status !== "paid") {
    return NextResponse.json(
      { error: "Order not paid" },
      { status: 400 }
    );
  }

  // Check if already activated
  if (order.enrollment_completed_at) {
    return NextResponse.json(
      { error: "Already activated" },
      { status: 400 }
    );
  }

  // Check if token expired
  if (order.enrollment_token_expires_at) {
    const expiresAt = new Date(order.enrollment_token_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    valid: true,
    email: order.email,
    firstName: order.first_name,
    lastName: order.last_name,
    courseName: order.course_name,
    orderNumber: order.order_number,
  });
}

// POST: Activate account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    interface FullOrderRow {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      course_id: string;
      course_name: string;
      order_number: string;
      enrollment_token_expires_at: string | null;
      enrollment_completed_at: string | null;
      status: string;
      amount: number;
      currency: string;
      paid_at: string | null;
      monri_transaction_id: string | null;
      monri_approval_code: string | null;
      monri_response_code: string | null;
    }

    // Find order by enrollment token
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("enrollment_token", token)
      .single() as { data: FullOrderRow | null; error: unknown };

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 404 }
      );
    }

    // Check if order was paid
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order not paid" },
        { status: 400 }
      );
    }

    // Check if already activated
    if (order.enrollment_completed_at) {
      return NextResponse.json(
        { error: "Account already activated" },
        { status: 400 }
      );
    }

    // Check if token expired
    if (order.enrollment_token_expires_at) {
      const expiresAt = new Date(order.enrollment_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Activation link has expired" },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === order.email
    );

    let userId: string;

    if (existingUser) {
      // User exists, just update their password
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (updateError) {
        console.error("Failed to update user password:", updateError);
        return NextResponse.json(
          { error: "Failed to update account" },
          { status: 500 }
        );
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: order.email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${order.first_name} ${order.last_name}`,
          },
        });

      if (createError) {
        console.error("Failed to create user:", createError);
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }

      userId = newUser.user!.id;
    }

    // Determine package based on course
    const packageType = COURSE_PACKAGES[order.course_id] || "basic";

    // Create enrollment
    const { error: enrollmentError } = await supabase.from("enrollments").insert({
      user_id: userId,
      order_id: order.id,
      course_id: order.course_id,
      package: packageType,
      status: "active",
      amount_paid: order.amount,
      currency: order.currency,
      order_number: order.order_number,
      monri_transaction_id: order.monri_transaction_id,
      monri_approval_code: order.monri_approval_code,
      monri_response_code: order.monri_response_code,
      purchased_at: order.paid_at || new Date().toISOString(),
      expires_at: null, // Lifetime access
    } as never);

    if (enrollmentError) {
      console.error("Failed to create enrollment:", enrollmentError);
      // Don't fail if enrollment creation fails - user can still login
    }

    // Mark order as enrollment completed
    await supabase
      .from("orders")
      .update({
        enrollment_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", order.id);

    console.log(`Account activated for ${order.email}, user ID: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Account activated successfully",
    });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Activation failed" },
      { status: 500 }
    );
  }
}
