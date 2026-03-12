import { createAdminClient } from "@/lib/supabase/admin";
import { RateLimiter } from "./utils/rate-limiter";
import { dedupKey } from "./utils/dedup";
import type { Json } from "@/lib/supabase/types";

export interface ScrapedVenue {
  source: string;
  sourceId: string;
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  capacity?: number | null;
  genres?: string[];
  venueType?: string;
  websiteUrl?: string | null;
  bookingEmail?: string | null;
  bookingContact?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  rawData?: Json;
}

export interface ScrapedEvent {
  source: string;
  sourceId: string;
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  genres?: string[];
  eventType?: string;
  lineup?: string[];
  applicationUrl?: string | null;
  applicationDeadline?: string | null;
  websiteUrl?: string | null;
  bookingEmail?: string | null;
  status?: string;
  rawData?: Json;
}

export interface ScrapeResult {
  venuesFound: number;
  venuesNew: number;
  eventsFound: number;
  eventsNew: number;
  errors: string[];
}

export abstract class BaseScraper {
  protected rateLimiter: RateLimiter;
  protected source: string;

  constructor(source: string, requestIntervalMs = 3000) {
    this.source = source;
    this.rateLimiter = new RateLimiter(1, requestIntervalMs);
  }

  abstract scrapeVenues(): Promise<ScrapedVenue[]>;
  abstract scrapeEvents(): Promise<ScrapedEvent[]>;

  async run(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      venuesFound: 0,
      venuesNew: 0,
      eventsFound: 0,
      eventsNew: 0,
      errors: [],
    };

    const supabase = createAdminClient();

    // Scrape venues
    try {
      const venues = await this.scrapeVenues();
      result.venuesFound = venues.length;

      for (const venue of venues) {
        try {
          const { error } = await supabase.from("discovered_venues").upsert(
            {
              source: venue.source,
              source_id: venue.sourceId,
              name: venue.name,
              city: venue.city ?? null,
              state: venue.state ?? null,
              country: venue.country ?? null,
              capacity: venue.capacity ?? null,
              genres: venue.genres ?? null,
              venue_type: venue.venueType ?? "club",
              website_url: venue.websiteUrl ?? null,
              booking_email: venue.bookingEmail ?? null,
              booking_contact: venue.bookingContact ?? null,
              phone: venue.phone ?? null,
              lat: venue.lat ?? null,
              lng: venue.lng ?? null,
              raw_data: venue.rawData ?? null,
              last_scraped_at: new Date().toISOString(),
            },
            { onConflict: "source,source_id" }
          );

          if (error) {
            // Try insert if upsert fails (constraint mismatch)
            const { error: insertError } = await supabase
              .from("discovered_venues")
              .insert({
                source: venue.source,
                source_id: venue.sourceId,
                name: venue.name,
                city: venue.city ?? null,
                state: venue.state ?? null,
                country: venue.country ?? null,
                capacity: venue.capacity ?? null,
                genres: venue.genres ?? null,
                venue_type: venue.venueType ?? "club",
                website_url: venue.websiteUrl ?? null,
                booking_email: venue.bookingEmail ?? null,
                booking_contact: venue.bookingContact ?? null,
                phone: venue.phone ?? null,
                lat: venue.lat ?? null,
                lng: venue.lng ?? null,
                raw_data: venue.rawData ?? null,
                last_scraped_at: new Date().toISOString(),
              });

            if (!insertError) result.venuesNew++;
            else if (!insertError.message.includes("duplicate"))
              result.errors.push(`Venue ${venue.name}: ${insertError.message}`);
          }
        } catch (err) {
          result.errors.push(
            `Venue ${venue.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    } catch (err) {
      result.errors.push(
        `Venue scraping failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Scrape events
    try {
      const events = await this.scrapeEvents();
      result.eventsFound = events.length;

      for (const event of events) {
        try {
          const { error } = await supabase.from("discovered_events").insert({
            source: event.source,
            source_id: event.sourceId,
            name: event.name,
            city: event.city ?? null,
            state: event.state ?? null,
            country: event.country ?? null,
            start_date: event.startDate ?? null,
            end_date: event.endDate ?? null,
            genres: event.genres ?? null,
            event_type: event.eventType ?? "festival",
            lineup: event.lineup ?? null,
            application_url: event.applicationUrl ?? null,
            application_deadline: event.applicationDeadline ?? null,
            website_url: event.websiteUrl ?? null,
            booking_email: event.bookingEmail ?? null,
            status: event.status ?? "active",
            raw_data: event.rawData ?? null,
            last_scraped_at: new Date().toISOString(),
          });

          if (!error) result.eventsNew++;
          else if (!error.message.includes("duplicate"))
            result.errors.push(`Event ${event.name}: ${error.message}`);
        } catch (err) {
          result.errors.push(
            `Event ${event.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    } catch (err) {
      result.errors.push(
        `Event scraping failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Update scrape job record
    try {
      await supabase
        .from("scrape_sources")
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("name", this.source);
    } catch {
      // Non-critical
    }

    return result;
  }
}

/**
 * Helper to generate a dedup-friendly source_id when the source doesn't provide one.
 */
export function generateSourceId(name: string, city: string | null): string {
  return dedupKey(name, city).replace(/[^a-z0-9|]/g, "").substring(0, 100);
}
