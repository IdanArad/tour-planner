import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find reachouts that were sent more than 5 days ago with no reply
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const { data: reachouts, error } = await supabase
    .from("reachouts")
    .select("id, venue_id, contact_id, tour_id, sent_at")
    .eq("status", "sent")
    .lte("sent_at", fiveDaysAgo.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const checked = reachouts?.length ?? 0;
  const followUpsNeeded: string[] = [];

  for (const reachout of reachouts ?? []) {
    // Check if automation_rules exist for auto_follow_up
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("id")
      .eq("rule_type", "auto_follow_up")
      .eq("is_active", true)
      .limit(1);

    if (rules && rules.length > 0) {
      // Log what would be followed up (actual sending comes later)
      console.log(
        `[Follow-Up Cron] Reachout ${reachout.id} needs follow-up (sent at ${reachout.sent_at})`
      );
      followUpsNeeded.push(reachout.id);
    }
  }

  return NextResponse.json({ checked, followUpsNeeded: followUpsNeeded.length });
}
