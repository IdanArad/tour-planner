"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addShow(data: {
  org_id: string;
  venue_id: string;
  artist_id: string;
  date: string;
  tour_id?: string | null;
  status?: string;
  type?: string;
  guarantee?: number | null;
  ticket_price?: number | null;
  doors_time?: string | null;
  set_time?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("shows").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/shows");
  revalidatePath("/");
  return { error: null };
}

export async function updateShowStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shows")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shows");
  revalidatePath("/");
  return { error: null };
}

export async function updateShow(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shows")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shows");
  revalidatePath("/");
  return { error: null };
}

export async function deleteShow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shows");
  revalidatePath("/");
  return { error: null };
}
