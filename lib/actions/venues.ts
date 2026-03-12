"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addVenue(data: {
  org_id: string;
  name: string;
  city: string;
  state?: string | null;
  country?: string;
  capacity?: number | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: venue, error } = await supabase
    .from("venues")
    .insert(data)
    .select()
    .single();
  if (error) return { error: error.message, venue: null };
  revalidatePath("/venues");
  return { error: null, venue };
}

export async function updateVenue(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("venues")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/venues");
  return { error: null };
}

export async function deleteVenue(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/venues");
  return { error: null };
}
