"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/email/client";

export async function createTemplate(data: {
  org_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  template_type: string;
  variables: string[];
}) {
  const supabase = await createClient();
  const { data: template, error } = await supabase
    .from("email_templates")
    .insert(data)
    .select()
    .single();

  if (error) return { error: error.message, template: null };
  revalidatePath("/email");
  return { error: null, template };
}

export async function updateTemplate(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/email");
  return { error: null };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/email");
  return { error: null };
}

export async function sendEmail(data: {
  org_id: string;
  reachout_id?: string;
  to_email: string;
  subject: string;
  body_html: string;
}) {
  const supabase = await createClient();

  // Create email_message record with queued status
  const { data: message, error: insertError } = await supabase
    .from("email_messages")
    .insert({
      org_id: data.org_id,
      reachout_id: data.reachout_id ?? null,
      to_email: data.to_email,
      subject: data.subject,
      body_html: data.body_html,
      status: "queued",
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message, message: null };

  // Send via Resend
  const resend = getResendClient();
  const { data: sent, error: sendError } = await resend.emails.send({
    from: "Tour Planner <noreply@tourplanner.app>",
    to: data.to_email,
    subject: data.subject,
    html: data.body_html,
  });

  if (sendError) {
    await supabase
      .from("email_messages")
      .update({ status: "failed", error_message: sendError.message })
      .eq("id", message.id);
    return { error: sendError.message, message: null };
  }

  // Update with sent status and external_id
  await supabase
    .from("email_messages")
    .update({
      status: "sent",
      external_id: sent?.id ?? null,
      sent_at: new Date().toISOString(),
    })
    .eq("id", message.id);

  revalidatePath("/reachouts");
  return { error: null, message: { ...message, external_id: sent?.id } };
}
