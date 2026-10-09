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

// Sends through the mailbox in SMTP_USER (e.g. Google Workspace with an app
// password) when configured, so mail comes from the real address and replies
// land in its inbox. Falls back to Resend otherwise.
export async function sendMail(email: OutgoingEmail): Promise<SendResult> {
  const from = process.env.EMAIL_FROM;

  if (process.env.SMTP_USER || process.env.SMTP_HOST) {
    const user = process.env.SMTP_USER;
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: user ? { user, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    try {
      const info = await transport.sendMail({ from: from ?? user, ...email });
      return { id: info.messageId ?? null, error: null };
    } catch (error) {
      return { id: null, error: error instanceof Error ? error.message : "SMTP send failed" };
    }
  }

  if (!from) {
    return { id: null, error: "EMAIL_FROM is not configured" };
  }
  try {
    const { data, error } = await getResendClient().emails.send({ from, ...email });
    return { id: data?.id ?? null, error: error?.message ?? null };
  } catch (error) {
    return { id: null, error: error instanceof Error ? error.message : "Resend send failed" };
  }
}
