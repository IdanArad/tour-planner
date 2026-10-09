import nodemailer from "nodemailer";
import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
}

interface SendResult {
  id: string | null;
  error: string | null;
}

const RESEND_DEFAULT_FROM = "Tour Planner <noreply@tourplanner.app>";
const SMTP_TIMEOUT_MS = 15_000;
const SINGLE_ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

// Callers pass request data straight through, so check it at runtime: nodemailer
// would treat an object as a file/URL to load, and a comma list as many recipients.
export function validateOutgoingEmail(email: {
  to: unknown;
  subject: unknown;
  html: unknown;
}): string | null {
  if (typeof email.to !== "string" || !SINGLE_ADDRESS.test(email.to)) {
    return "Recipient must be a single valid email address";
  }
  if (typeof email.subject !== "string" || !email.subject.trim()) {
    return "Subject is required";
  }
  if (typeof email.html !== "string" || !email.html.trim()) {
    return "Email body is required";
  }
  return null;
}

// Sends through the mailbox in SMTP_USER (e.g. Google Workspace with an app
// password) when configured, so mail comes from the real address and replies
// land in its inbox. Falls back to Resend otherwise.
export async function sendMail(email: OutgoingEmail): Promise<SendResult> {
  const invalid = validateOutgoingEmail(email);
  if (invalid) return { id: null, error: invalid };

  const { to, subject, html } = email;

  if (process.env.SMTP_USER || process.env.SMTP_HOST) {
    const user = process.env.SMTP_USER;
    const from = process.env.EMAIL_FROM || user;
    if (!from) {
      return { id: null, error: "EMAIL_FROM is not configured" };
    }
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = port === 465;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure,
      // Never send the mailbox password over a connection that didn't upgrade to TLS
      requireTLS: !secure && !!user,
      auth: user ? { user, pass: process.env.SMTP_PASSWORD } : undefined,
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
    try {
      const info = await transport.sendMail({ from, to, subject, html });
      return { id: info.messageId ?? null, error: null };
    } catch (error) {
      return { id: null, error: error instanceof Error ? error.message : "SMTP send failed" };
    }
  }

  const from = process.env.EMAIL_FROM || RESEND_DEFAULT_FROM;
  try {
    const { data, error } = await getResendClient().emails.send({ from, to, subject, html });
    return { id: data?.id ?? null, error: error?.message ?? null };
  } catch (error) {
    return { id: null, error: error instanceof Error ? error.message : "Resend send failed" };
  }
}
