import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getArtists(supabase: Client) {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getArtistById(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getFirstArtist(supabase: Client) {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}
