import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getShows(supabase: Client) {
  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getShowById(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getUpcomingShows(supabase: Client) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .gte("date", today)
    .not("status", "in", '("cancelled","played")')
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getShowsByTour(supabase: Client, tourId: string) {
  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .eq("tour_id", tourId)
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}
