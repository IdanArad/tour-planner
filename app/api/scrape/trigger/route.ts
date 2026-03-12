import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getScraper } from "@/lib/scrapers/registry";

export async function POST(request: NextRequest) {
  // Verify cron secret (also used for manual triggers)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { source: sourceName } = body;

  if (!sourceName) {
    return NextResponse.json(
      { error: "Missing 'source' in request body" },
      { status: 400 }
    );
  }

  const scraper = getScraper(sourceName);
  if (!scraper) {
    return NextResponse.json(
      { error: `No scraper found for source: ${sourceName}` },
      { status: 404 }
    );
  }

  const supabase = createAdminClient();

  // Create job record
  const { data: source } = await supabase
    .from("scrape_sources")
    .select("id")
    .eq("name", sourceName)
    .single();

  let jobId: string | null = null;
  if (source) {
    const { data: job } = await supabase
      .from("scrape_jobs")
      .insert({
        source_id: source.id,
        status: "running",
        job_type: "manual",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    jobId = job?.id ?? null;
  }

  try {
    const result = await scraper.run();

    if (jobId) {
      await supabase
        .from("scrape_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_found: result.venuesFound + result.eventsFound,
          items_new: result.venuesNew + result.eventsNew,
          error_log: result.errors.length > 0 ? result.errors.join("\n") : null,
        })
        .eq("id", jobId);
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (jobId) {
      await supabase
        .from("scrape_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_log: message,
        })
        .eq("id", jobId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
