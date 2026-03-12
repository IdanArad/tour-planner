"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const orgName = formData.get("orgName") as string;

  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Use admin client for org + membership creation to bypass RLS
  // (user session may not be established if email confirmation is on)
  const admin = createAdminClient();

  // Create the organization
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName, slug: `${slug}-${Date.now()}` })
    .select()
    .single();

  if (orgError) {
    return { error: orgError.message };
  }

  // Create the membership (owner role)
  const { error: memberError } = await admin.from("memberships").insert({
    user_id: authData.user.id,
    org_id: org.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  // Sign in immediately so the user has a session
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
