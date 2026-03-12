"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addContact(data: {
  org_id: string;
  venue_id?: string | null;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/venues");
  return { error: null };
}

export async function updateContact(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/venues");
  return { error: null };
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/venues");
  return { error: null };
}
