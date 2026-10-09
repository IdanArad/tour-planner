// Creates the E2E test user in the local Supabase stack and adds it to the
// demo org from supabase/seed.sql. Safe to run repeatedly.
import { createClient } from "@supabase/supabase-js";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_EMAIL, TEST_PASSWORD } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_EMAIL or TEST_PASSWORD");
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(NEXT_PUBLIC_SUPABASE_URL)) {
  throw new Error(`Refusing to seed a non-local Supabase: ${NEXT_PUBLIC_SUPABASE_URL}`);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) throw listError;
let user = list.users.find((u) => u.email === TEST_EMAIL);

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "E2E Tester" },
  });
  if (error) throw error;
  user = data.user;
}

const { error: membershipError } = await supabase
  .from("memberships")
  .upsert({ user_id: user.id, org_id: DEMO_ORG_ID, role: "owner" }, { onConflict: "user_id,org_id" });
if (membershipError) throw membershipError;

console.log(`E2E user ready: ${TEST_EMAIL}`);
