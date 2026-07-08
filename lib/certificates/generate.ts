import { createAdminClient } from "@/lib/supabase/server";

interface CertificateData {
  certificateNumber: string;
  recipientName: string;
  courseTitle: string;
  completionDate: Date;
  approvedAt: Date;
}

/**
 * Generate a certificate PDF using server-side rendering
 * For production, consider using @react-pdf/renderer or a PDF service like PDFShift
 *
 * This is a placeholder that creates a simple HTML-based certificate
 * that can be rendered as PDF using headless Chrome or similar
 */
export async function generateCertificatePDF(
  userId: string,
  certificateNumber: string
): Promise<string | null> {
  const adminClient = createAdminClient();

  // Get user profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (!profile) {
    console.error("Profile not found for user:", userId);
    return null;
  }

  // Generate certificate HTML content
  const certificateHtml = generateCertificateHTML({
    certificateNumber,
    recipientName: profile.full_name,
    courseTitle: "Brendia Pro Artist",
    completionDate: new Date(),
    approvedAt: new Date(),
  });

  // In production, you would:
  // 1. Use @react-pdf/renderer to generate a proper PDF
  // 2. Or use a service like PDFShift, Puppeteer, or similar
  // 3. Upload to Supabase Storage
  // 4. Return the public URL

  // For now, we'll store the HTML and return a signed URL path
  // The actual PDF generation can be done on-demand when downloading

  try {
    // Store certificate data in storage (as HTML for now)
    const fileName = `certificates/${userId}/${certificateNumber}.html`;
    const { error: uploadError } = await adminClient.storage
      .from("certificates")
      .upload(fileName, certificateHtml, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Certificate upload error:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("certificates")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error("Certificate generation error:", error);
    return null;
  }
}

function generateCertificateHTML(data: CertificateData): string {
  const formattedDate = data.approvedAt.toLocaleDateString("hr-HR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certifikat - ${data.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f5f5f5;
      padding: 40px;
    }

    .certificate {
      width: 800px;
      height: 565px;
      margin: 0 auto;
      background: linear-gradient(135deg, #fef7e7 0%, #fff 100%);
      border: 3px solid #c9a96e;
      border-radius: 8px;
      padding: 40px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #c9a96e;
      border-radius: 4px;
      pointer-events: none;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 2px;
    }

    .logo span {
      color: #c9a96e;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 4px;
    }

    .subtitle {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 25px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .recipient {
      text-align: center;
      margin-bottom: 20px;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 600;
      color: #c9a96e;
      border-bottom: 2px solid #c9a96e;
      display: inline-block;
      padding: 0 20px 10px;
    }

    .course {
      text-align: center;
      font-size: 16px;
      color: #333;
      margin-bottom: 25px;
      line-height: 1.6;
    }

    .course strong {
      font-weight: 600;
    }

    .details {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .detail {
      text-align: center;
    }

    .detail-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: 500;
    }

    .signature {
      text-align: center;
      margin-top: 20px;
    }

    .signature-line {
      width: 200px;
      border-bottom: 1px solid #1a1a1a;
      margin: 0 auto 5px;
    }

    .signature-name {
      font-size: 12px;
      color: #666;
    }

    .watermark {
      position: absolute;
      bottom: 20px;
      right: 20px;
      opacity: 0.1;
      font-size: 80px;
      font-family: 'Playfair Display', serif;
      color: #c9a96e;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">BRENDIA<span>PRO</span></div>
    </div>

    <h1 class="title">Certifikat</h1>
    <p class="subtitle">Potvrđuje se da</p>

    <div class="recipient">
      <span class="recipient-name">${escapeHtml(data.recipientName)}</span>
    </div>

    <p class="course">
      uspješno je završio/la profesionalni tečaj<br>
      <strong>${escapeHtml(data.courseTitle)}</strong><br>
      i stekao/la certifikat ovlaštenog Brendia Pro Artista
    </p>

    <div class="details">
      <div class="detail">
        <div class="detail-label">Datum izdavanja</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      <div class="detail">
        <div class="detail-label">Broj certifikata</div>
        <div class="detail-value">${data.certificateNumber}</div>
      </div>
      <div class="detail signature">
        <div class="signature-line"></div>
        <div class="signature-name">Brendia Pro Academy</div>
      </div>
    </div>

    <div class="watermark">BP</div>
  </div>
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  const div = { innerHTML: "" };
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
