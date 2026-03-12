import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getVenues(supabase: Client) {
  const { data, error } = await supabase
    .from("venues")
    .select("*, contacts(*)")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getVenueById(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("venues")
    .select("*, contacts(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
