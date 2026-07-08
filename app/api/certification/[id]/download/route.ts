import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Download certificate PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    interface CertificationRow {
      id: string;
      status: string;
      certificate_url: string | null;
      certificate_number: string | null;
    }

    // Fetch certification
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("id", certificationId)
      .eq("user_id", user.id)
      .single() as { data: CertificationRow | null; error: unknown };

    if (certError || !certification) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    if (certification.status !== "approved") {
      return NextResponse.json(
        { error: "Certificate not yet approved" },
        { status: 400 }
      );
    }

    if (!certification.certificate_url) {
      return NextResponse.json(
        { error: "Certificate file not available" },
        { status: 404 }
      );
    }

    // If certificate_url is a Supabase Storage URL, generate a signed URL
    if (certification.certificate_url.includes("supabase.co/storage")) {
      const path = certification.certificate_url.split("/storage/v1/object/")[1];
      if (path) {
        const { data: signedUrl, error: signError } = await supabase.storage
          .from("certificates")
          .createSignedUrl(path.replace("public/certificates/", ""), 60 * 5); // 5 minutes

        if (signError) {
          console.error("Signed URL error:", signError);
          return NextResponse.json(
            { error: "Failed to generate download link" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          downloadUrl: signedUrl.signedUrl,
          certificateNumber: certification.certificate_number,
          expiresIn: 300, // 5 minutes in seconds
        });
      }
    }

    // Return direct URL if not Supabase Storage
    return NextResponse.json({
      downloadUrl: certification.certificate_url,
      certificateNumber: certification.certificate_number,
    });
  } catch (error) {
    console.error("Download certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
