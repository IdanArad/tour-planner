import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Validate auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, reachout_id, to_email, subject, body_html } = body;

    if (!org_id || !to_email || !subject || !body_html) {
      return NextResponse.json(
        { error: "Missing required fields: org_id, to_email, subject, body_html" },
        { status: 400 }
      );
    }

    // Create email_message record (queued)
    const { data: message, error: insertError } = await supabase
      .from("email_messages")
      .insert({
        org_id,
        reachout_id: reachout_id ?? null,
        to_email,
        subject,
        body_html,
        status: "queued",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const sent = await sendMail({ to: to_email, subject, html: body_html });

    if (sent.error) {
      await supabase
        .from("email_messages")
        .update({ status: "failed", error_message: sent.error })
        .eq("id", message.id);

      return NextResponse.json({ error: sent.error }, { status: 500 });
    }

    // Update status to sent with external_id
    await supabase
      .from("email_messages")
      .update({
        status: "sent",
        external_id: sent.id,
        sent_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    return NextResponse.json({ success: true, messageId: sent.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
