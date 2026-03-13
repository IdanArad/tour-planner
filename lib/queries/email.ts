import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getEmailTemplates(supabase: Client, orgId: string) {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEmailsForReachout(
  supabase: Client,
  reachoutId: string
) {
  const { data, error } = await supabase
    .from("email_messages")
    .select("*")
    .eq("reachout_id", reachoutId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEmailStats(supabase: Client, orgId: string) {
  const { data, error } = await supabase
    .from("email_messages")
    .select("status")
    .eq("org_id", orgId);

  if (error) throw error;

  const sent = data.filter((m) => m.status === "sent").length;
  const delivered = data.filter((m) => m.status === "delivered").length;
  const opened = data.filter((m) => m.status === "opened").length;
  const bounced = data.filter((m) => m.status === "bounced").length;

  return { sent, delivered, opened, bounced };
}
