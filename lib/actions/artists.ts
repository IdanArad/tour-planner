"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addArtist(data: {
  org_id: string;
  name: string;
  genre?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: artist, error } = await supabase
    .from("artists")
    .insert(data)
    .select()
    .single();
  if (error) return { error: error.message, artist: null };
  revalidatePath("/");
  return { error: null, artist };
}

export async function updateArtist(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("artists")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}
