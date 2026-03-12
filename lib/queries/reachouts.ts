import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getReachouts(supabase: Client) {
  const { data, error } = await supabase
    .from("reachouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReachoutsByStatus(supabase: Client, status: string) {
  const { data, error } = await supabase
    .from("reachouts")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReachoutStats(supabase: Client) {
  const { data, error } = await supabase.from("reachouts").select("status");

  if (error) throw error;

  const total = data.length;
  const sent = data.filter((r) => r.status === "sent").length;
  const replied = data.filter(
    (r) => r.status === "replied" || r.status === "booked"
  ).length;
  const needsFollowUp = data.filter((r) => r.status === "follow_up").length;
  const noResponse = data.filter((r) => r.status === "no_response").length;
  const declined = data.filter((r) => r.status === "declined").length;
  const responseRate =
    total > 0 ? Math.round(((replied + declined) / total) * 100) : 0;

  return { total, sent, replied, needsFollowUp, noResponse, responseRate };
}
