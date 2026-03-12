"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addReachout(data: {
  org_id: string;
  venue_id: string;
  contact_id?: string | null;
  tour_id?: string | null;
  status?: string;
  method?: string | null;
  sent_at?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("reachouts").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/reachouts");
  revalidatePath("/");
  return { error: null };
}

export async function updateReachoutStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reachouts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/reachouts");
  revalidatePath("/");
  return { error: null };
}

export async function updateReachout(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reachouts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/reachouts");
  revalidatePath("/");
  return { error: null };
}

export async function deleteReachout(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reachouts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/reachouts");
  revalidatePath("/");
  return { error: null };
}
