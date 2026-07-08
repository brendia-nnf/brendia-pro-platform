import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmation, sendWelcomeEmail } from "@/lib/email/send";
import {
  verifyCallbackDigest,
  isSuccessfulPayment,
  getResponseMessage,
} from "@/lib/monri/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract callback parameters
    const orderNumber = formData.get("order_number") as string;
    const responseCode = formData.get("response_code") as string;
    const amount = formData.get("amount") as string;
    const currency = (formData.get("currency") as string) || "EUR";
    const digest = formData.get("digest") as string;
    const transactionId = formData.get("transaction_id") as string;
    const approvalCode = formData.get("approval_code") as string;
    const panToken = formData.get("pan_token") as string;
    const maskedPan = formData.get("masked_pan") as string;

    console.log(`Monri callback received for order: ${orderNumber}`);
    console.log(`Response code: ${responseCode} - ${getResponseMessage(responseCode)}`);

    // Validate required fields
    if (!orderNumber || !responseCode || !amount || !digest) {
      console.error("Missing required callback fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify callback digest
    const amountNumber = parseInt(amount, 10);
    const isValid = verifyCallbackDigest(
      digest,
      orderNumber,
      responseCode,
      amountNumber,
      currency
    );

    if (!isValid) {
      console.error("Invalid callback digest");
      return NextResponse.json(
        { error: "Invalid digest" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const isSuccess = isSuccessfulPayment(responseCode);

    // Try to find the order in webshop_orders first
    const { data: webshopOrder, error: webshopError } = await supabase
      .from("webshop_orders")
      .select("id, status, customer_email, customer_name, items, subtotal, shipping, total")
      .eq("order_number", orderNumber)
      .single();

    if (webshopOrder) {
      // Handle webshop order callback
      await handleWebshopCallback(
        supabase,
        webshopOrder,
        orderNumber,
        isSuccess,
        transactionId,
        approvalCode,
        responseCode,
        panToken,
        maskedPan
      );
    } else {
      // Try to find in enrollments (course purchase)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id, status, user_id, course_id, amount_paid")
        .eq("order_number", orderNumber)
        .single();

      if (enrollment) {
        // Handle enrollment callback
        await handleEnrollmentCallback(
          supabase,
          enrollment,
          orderNumber,
          isSuccess,
          transactionId,
          approvalCode,
          responseCode,
          panToken,
          maskedPan
        );
      } else {
        console.error("Order not found in any table:", orderNumber);
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      status: isSuccess ? "paid" : "cancelled",
    });
  } catch (error) {
    console.error("Monri callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}

async function handleWebshopCallback(
  supabase: ReturnType<typeof createAdminClient>,
  order: {
    id: string;
    status: string;
    customer_email: string;
    customer_name: string;
    items: unknown;
    subtotal: number;
    shipping: number;
    total: number;
  },
  orderNumber: string,
  isSuccess: boolean,
  transactionId: string | null,
  approvalCode: string | null,
  responseCode: string,
  panToken: string | null,
  maskedPan: string | null
) {
  const newStatus = isSuccess ? "paid" : "cancelled";

  const updateData: Record<string, unknown> = {
    status: newStatus,
    monri_transaction_id: transactionId || null,
    monri_approval_code: approvalCode || null,
    monri_response_code: responseCode,
    monri_pan_token: panToken || null,
    monri_masked_pan: maskedPan || null,
    updated_at: new Date().toISOString(),
  };

  if (isSuccess) {
    updateData.paid_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("webshop_orders")
    .update(updateData as never)
    .eq("id", order.id);

  if (updateError) {
    console.error("Failed to update webshop order:", updateError);
    throw updateError;
  }

  console.log(`Webshop order ${orderNumber} updated to status: ${newStatus}`);

  // TODO: Send order confirmation email if successful
  // if (isSuccess && order.customer_email) {
  //   await sendOrderConfirmation(order.customer_email, order.customer_name, orderNumber, order.items);
  // }
}

async function handleEnrollmentCallback(
  supabase: ReturnType<typeof createAdminClient>,
  enrollment: {
    id: string;
    status: string;
    user_id: string;
    course_id: string;
    amount_paid: number;
  },
  orderNumber: string,
  isSuccess: boolean,
  transactionId: string | null,
  approvalCode: string | null,
  responseCode: string,
  panToken: string | null,
  maskedPan: string | null
) {
  const newStatus = isSuccess ? "active" : "cancelled";

  const updateData: Record<string, unknown> = {
    status: newStatus,
    monri_transaction_id: transactionId || null,
    monri_approval_code: approvalCode || null,
    monri_response_code: responseCode,
    monri_pan_token: panToken || null,
    monri_masked_pan: maskedPan || null,
    updated_at: new Date().toISOString(),
  };

  if (isSuccess) {
    updateData.purchased_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("enrollments")
    .update(updateData as never)
    .eq("id", enrollment.id);

  if (updateError) {
    console.error("Failed to update enrollment:", updateError);
    throw updateError;
  }

  console.log(`Enrollment ${orderNumber} updated to status: ${newStatus}`);

  // Send confirmation emails if successful
  if (isSuccess) {
    try {
      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(enrollment.user_id);
      const userEmail = userData?.user?.email;
      const userName = userData?.user?.user_metadata?.full_name || "there";

      if (userEmail) {
        const courseNames: Record<string, string> = {
          foundation: "Brendia Pro Artist",
          master: "Brendia Pro Master",
          advanced: "Advanced Brendia Pro Artist",
        };

        const courseName = courseNames[enrollment.course_id] || "Brendia Pro";
        const price = `${(enrollment.amount_paid / 100).toFixed(2)} EUR`;

        await sendPurchaseConfirmation(
          userEmail,
          userName,
          courseName,
          price,
          orderNumber
        );
      }
    } catch (emailError) {
      console.error("Purchase confirmation email error:", emailError);
    }
  }
}

// Also support GET for redirects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNumber = searchParams.get("order_number");
  const responseCode = searchParams.get("response_code");

  console.log(`Monri redirect received: order=${orderNumber}, response=${responseCode}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (responseCode && isSuccessfulPayment(responseCode)) {
    return NextResponse.redirect(`${baseUrl}/webshop/blagajna/uspjeh?order_number=${orderNumber}`);
  } else {
    return NextResponse.redirect(`${baseUrl}/webshop/kosarica?order_number=${orderNumber}`);
  }
}
