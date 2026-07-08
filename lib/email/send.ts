import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const {
    to,
    subject,
    html,
    from = "Brendia Pro <info@brendiapro.hr>",
    replyTo = "info@brendiapro.hr",
  } = options;

  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
}

// Convenience functions for specific email types
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  purchaseConfirmationEmail,
  certificationApprovedEmail,
  certificationRejectedEmail,
  contactConfirmationEmail,
  adminContactNotificationEmail,
  welcomeBoxShippedEmail,
  enrollmentActivationEmail,
} from "./templates";

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Dobro dosli u Brendia Pro!",
    html: welcomeEmail(name),
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
) {
  return sendEmail({
    to,
    subject: "Potvrdite svoju email adresu - Brendia Pro",
    html: verificationEmail(name, verifyUrl),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  return sendEmail({
    to,
    subject: "Promjena lozinke - Brendia Pro",
    html: passwordResetEmail(name, resetUrl),
  });
}

export async function sendPurchaseConfirmation(
  to: string,
  name: string,
  courseName: string,
  price: string,
  orderNumber: string
) {
  return sendEmail({
    to,
    subject: `Potvrda kupnje - ${courseName}`,
    html: purchaseConfirmationEmail(name, courseName, price, orderNumber),
  });
}

export async function sendCertificationApproved(
  to: string,
  name: string,
  certificateNumber: string,
  downloadUrl: string
) {
  return sendEmail({
    to,
    subject: "Cestitamo! Vasa certifikacija je odobrena",
    html: certificationApprovedEmail(name, certificateNumber, downloadUrl),
  });
}

export async function sendCertificationRejected(
  to: string,
  name: string,
  reason: string
) {
  return sendEmail({
    to,
    subject: "Informacija o prijavi za certifikaciju",
    html: certificationRejectedEmail(name, reason),
  });
}

export async function sendContactConfirmation(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Primili smo vasu poruku - Brendia Pro",
    html: contactConfirmationEmail(name),
  });
}

export async function sendAdminContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@brendiapro.hr";

  return sendEmail({
    to: adminEmail,
    subject: `[Kontakt forma] ${subject}`,
    html: adminContactNotificationEmail(name, email, subject, message),
    replyTo: email,
  });
}

export async function sendWelcomeBoxShipped(
  to: string,
  name: string,
  trackingNumber: string
) {
  return sendEmail({
    to,
    subject: "Vas Welcome Box je poslan!",
    html: welcomeBoxShippedEmail(name, trackingNumber),
  });
}

export async function sendEnrollmentActivation(
  to: string,
  name: string,
  courseName: string,
  activationUrl: string,
  orderNumber: string
) {
  return sendEmail({
    to,
    subject: `Aktivirajte pristup: ${courseName} - Brendia Pro`,
    html: enrollmentActivationEmail(name, courseName, activationUrl, orderNumber),
  });
}
