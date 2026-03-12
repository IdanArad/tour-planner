import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export async function getTours(supabase: Client) {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTourById(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
