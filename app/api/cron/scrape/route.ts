import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find sources that are due for scraping
  const { data: sources } = await supabase
    .from("scrape_sources")
    .select("*")
    .eq("enabled", true)
    .or(`next_run_at.is.null,next_run_at.lte.${new Date().toISOString()}`);

  if (!sources || sources.length === 0) {
    return NextResponse.json({ message: "No sources due for scraping" });
  }

  const results = [];

  for (const source of sources) {
    // Create a job record
    const { data: job } = await supabase
      .from("scrape_jobs")
      .insert({
        source_id: source.id,
        status: "running",
        job_type: "incremental",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    try {
      // Dynamic import of the scraper based on source name
      // Each scraper is registered in lib/scrapers/registry.ts
      const { getScraper } = await import("@/lib/scrapers/registry");
      const scraper = getScraper(source.name);

      if (!scraper) {
        throw new Error(`No scraper registered for source: ${source.name}`);
      }

      const result = await scraper.run();

      // Update job as completed
      if (job) {
        await supabase
          .from("scrape_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            items_found: result.venuesFound + result.eventsFound,
            items_new: result.venuesNew + result.eventsNew,
            error_log: result.errors.length > 0 ? result.errors.join("\n") : null,
          })
          .eq("id", job.id);
      }

      results.push({ source: source.name, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (job) {
        await supabase
          .from("scrape_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_log: message,
          })
          .eq("id", job.id);
      }

      results.push({ source: source.name, error: message });
    }
  }

  return NextResponse.json({ results });
}
