import { BaseScraper } from "@/lib/scrapers/base";
import type { ScrapedVenue, ScrapedEvent } from "@/lib/scrapers/base";
import { fetchWithRetry } from "@/lib/scrapers/utils/rate-limiter";

const API_BASE = "https://api.setlist.fm/rest/1.0";

const EUROPEAN_COUNTRIES = [
  "DE", "NL", "BE", "AT", "CH", "FR", "GB", "ES", "IT", "PL",
  "CZ", "DK", "SE", "NO", "FI", "PT", "IE", "HU", "RO", "HR",
] as const;

const MAX_PAGES_PER_COUNTRY = 5;

/**
 * Setlist.fm venue API response types.
 */
interface SetlistfmCity {
  id: string;
  name: string;
  stateCode?: string;
  state?: { name: string };
  coords?: { lat: number; long: number };
  country: { code: string; name: string };
}

interface SetlistfmVenue {
  id: string;
  name: string;
  city: SetlistfmCity;
  url?: string;
}

interface SetlistfmVenueSearchResponse {
  venue?: SetlistfmVenue[];
  total: number;
  page: number;
  itemsPerPage: number;
}

export class SetlistfmScraper extends BaseScraper {
  private apiKey: string | undefined;

  constructor() {
    super("setlistfm", 2000);
    this.apiKey = process.env.SETLISTFM_API_KEY;
  }

  async scrapeVenues(): Promise<ScrapedVenue[]> {
    if (!this.apiKey) {
      console.warn(
        "[SetlistfmScraper] SETLISTFM_API_KEY not set — skipping venue scrape"
      );
      return [];
    }

    const venues: ScrapedVenue[] = [];

    for (const countryCode of EUROPEAN_COUNTRIES) {
      try {
        const countryVenues = await this.scrapeCountryVenues(countryCode);
        venues.push(...countryVenues);
      } catch (err) {
        console.error(
          `[SetlistfmScraper] Error scraping country ${countryCode}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    return venues;
  }

  async scrapeEvents(): Promise<ScrapedEvent[]> {
    // Setlist.fm scraper is venue-only
    return [];
  }

  private async scrapeCountryVenues(
    countryCode: string
  ): Promise<ScrapedVenue[]> {
    const venues: ScrapedVenue[] = [];

    for (let page = 1; page <= MAX_PAGES_PER_COUNTRY; page++) {
      await this.rateLimiter.acquire();

      const url = `${API_BASE}/search/venues?countryCode=${countryCode}&p=${page}`;
      const response = await fetchWithRetry(url, {
        headers: {
          "x-api-key": this.apiKey!,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No results for this country/page — stop paginating
          break;
        }
        console.warn(
          `[SetlistfmScraper] API returned ${response.status} for ${countryCode} page ${page}`
        );
        break;
      }

      const data: SetlistfmVenueSearchResponse = await response.json();
      const venueList = data.venue ?? [];

      if (venueList.length === 0) {
        break;
      }

      for (const raw of venueList) {
        venues.push(this.mapVenue(raw));
      }

      // Stop if we've fetched all available results
      const totalFetched = page * data.itemsPerPage;
      if (totalFetched >= data.total) {
        break;
      }
    }

    return venues;
  }

  private mapVenue(raw: SetlistfmVenue): ScrapedVenue {
    return {
      source: this.source,
      sourceId: raw.id,
      name: raw.name,
      city: raw.city?.name ?? null,
      state: raw.city?.state?.name ?? raw.city?.stateCode ?? null,
      country: raw.city?.country?.code ?? null,
      lat: raw.city?.coords?.lat ?? null,
      lng: raw.city?.coords?.long ?? null,
      websiteUrl: raw.url ?? null,
      rawData: JSON.parse(JSON.stringify(raw)),
    };
  }
}
