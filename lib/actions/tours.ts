"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTour(data: {
  org_id: string;
  artist_id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { data: tour, error } = await supabase
    .from("tours")
    .insert(data)
    .select()
    .single();
  if (error) return { error: error.message, tour: null };
  revalidatePath("/");
  return { error: null, tour };
}

export async function updateTour(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tours")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}

export async function deleteTour(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tours").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}
