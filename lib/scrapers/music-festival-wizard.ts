import * as cheerio from "cheerio";
import {
  BaseScraper,
  generateSourceId,
  type ScrapedEvent,
  type ScrapedVenue,
} from "@/lib/scrapers/base";
import { fetchWithRetry } from "@/lib/scrapers/utils/rate-limiter";

const BASE_URL = "https://www.musicfestivalwizard.com";
const EUROPE_FESTIVALS_PATH = "/festivals/europe/";

/**
 * Parse a date string like "Jun 5, 2026" or "June 5-7, 2026" into ISO date strings.
 * Returns { startDate, endDate } — endDate may be null for single-day events.
 */
function parseDateRange(dateText: string): {
  startDate: string | null;
  endDate: string | null;
} {
  if (!dateText) return { startDate: null, endDate: null };

  const cleaned = dateText.replace(/\s+/g, " ").trim();

  // Pattern: "Jun 5 - Jun 7, 2026" or "Jun 5 - 7, 2026" or "June 5-7, 2026"
  // Also handles: "Jun 5, 2026 - Jun 7, 2026"

  // Try: "Month Day - Month Day, Year"
  const crossMonthMatch = cleaned.match(
    /^(\w+)\s+(\d{1,2})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})$/
  );
  if (crossMonthMatch) {
    const [, startMonth, startDay, endMonth, endDay, year] = crossMonthMatch;
    return {
      startDate: toISODate(startMonth, startDay, year),
      endDate: toISODate(endMonth, endDay, year),
    };
  }

  // Try: "Month Day - Day, Year" (same month)
  const sameMonthMatch = cleaned.match(
    /^(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})$/
  );
  if (sameMonthMatch) {
    const [, month, startDay, endDay, year] = sameMonthMatch;
    return {
      startDate: toISODate(month, startDay, year),
      endDate: toISODate(month, endDay, year),
    };
  }

  // Try: "Month Day, Year - Month Day, Year"
  const fullRangeMatch = cleaned.match(
    /^(\w+)\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})$/
  );
  if (fullRangeMatch) {
    const [, startMonth, startDay, startYear, endMonth, endDay, endYear] =
      fullRangeMatch;
    return {
      startDate: toISODate(startMonth, startDay, startYear),
      endDate: toISODate(endMonth, endDay, endYear),
    };
  }

  // Try: single date "Month Day, Year"
  const singleMatch = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s*(\d{4})$/);
  if (singleMatch) {
    const [, month, day, year] = singleMatch;
    return {
      startDate: toISODate(month, day, year),
      endDate: null,
    };
  }

  return { startDate: null, endDate: null };
}

/**
 * Convert month name + day + year into YYYY-MM-DD.
 */
function toISODate(
  monthStr: string,
  dayStr: string,
  yearStr: string
): string | null {
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8, sept: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const monthIndex = months[monthStr.toLowerCase()];
  if (monthIndex === undefined) return null;

  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  if (isNaN(day) || isNaN(year)) return null;

  const date = new Date(year, monthIndex, day);
  return date.toISOString().split("T")[0];
}

/**
 * Extract country from a location string like "Berlin, Germany" or "Barcelona, Spain".
 * Returns { city, country }.
 */
function parseLocation(location: string): {
  city: string | null;
  country: string | null;
} {
  if (!location) return { city: null, country: null };

  const parts = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      city: parts[0] || null,
      country: parts[parts.length - 1] || null,
    };
  }

  if (parts.length === 1) {
    return { city: null, country: parts[0] || null };
  }

  return { city: null, country: null };
}

export class MusicFestivalWizardScraper extends BaseScraper {
  constructor() {
    super("music_festival_wizard", 3000);
  }

  async scrapeVenues(): Promise<ScrapedVenue[]> {
    // Music Festival Wizard is festival-focused, not venue-focused
    return [];
  }

  async scrapeEvents(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      await this.rateLimiter.acquire();

      const url =
        currentPage === 1
          ? `${BASE_URL}${EUROPE_FESTIVALS_PATH}`
          : `${BASE_URL}${EUROPE_FESTIVALS_PATH}page/${currentPage}/`;

      let html: string;
      try {
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          // If first page fails, throw. Otherwise just stop paginating.
          if (currentPage === 1) {
            throw new Error(
              `Failed to fetch ${url}: HTTP ${response.status}`
            );
          }
          break;
        }

        html = await response.text();
      } catch (err) {
        if (currentPage === 1) throw err;
        // For subsequent pages, stop paginating on network errors
        break;
      }

      const pageEvents = this.parseListingPage(html);

      if (pageEvents.length === 0) {
        // No festivals found on this page — end of pagination
        break;
      }

      events.push(...pageEvents);

      // Check for next page link
      hasNextPage = this.hasNextPage(html);
      currentPage++;
    }

    return events;
  }

  /**
   * Parse a single listing page and extract festival data.
   */
  private parseListingPage(html: string): ScrapedEvent[] {
    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    // Music Festival Wizard uses article/post elements for festival cards.
    // Common selectors: .festival-list .entry, article with festival info,
    // or .search-results .item patterns
    const festivalSelectors = [
      "article.type-festival",
      ".festival-card",
      ".search-results-festival",
      ".entry-festival",
      ".festival-listing .item",
      ".festivalCard",
      // Generic fallback: articles within main content
      "main article",
      ".content article",
      "#content article",
      ".search-results article",
      // Post-based layout
      ".post",
      ".hentry",
    ];

    let $cards: ReturnType<cheerio.CheerioAPI> | null = null;

    for (const selector of festivalSelectors) {
      const matches = $(selector);
      if (matches.length > 0) {
        $cards = matches;
        break;
      }
    }

    if (!$cards || $cards.length === 0) {
      // Fallback: try to find any repeated element with festival-like content
      $cards = $("article");
      if ($cards.length === 0) {
        return events;
      }
    }

    $cards.each((_, el) => {
      try {
        const $el = $(el);
        const event = this.parseFestivalCard($, $el);
        if (event) {
          events.push(event);
        }
      } catch {
        // Skip individual card parse errors
      }
    });

    return events;
  }

  /**
   * Parse a single festival card element into a ScrapedEvent.
   */
  private parseFestivalCard(
    $: cheerio.CheerioAPI,
    $el: ReturnType<cheerio.CheerioAPI>
  ): ScrapedEvent | null {
    // Extract festival name — look in headings or title links
    const name =
      $el.find("h2 a").first().text().trim() ||
      $el.find("h3 a").first().text().trim() ||
      $el.find("h2").first().text().trim() ||
      $el.find("h3").first().text().trim() ||
      $el.find(".entry-title a").first().text().trim() ||
      $el.find(".entry-title").first().text().trim() ||
      $el.find("a.festival-name").first().text().trim() ||
      $el.find("[class*='title'] a").first().text().trim() ||
      $el.find("[class*='title']").first().text().trim();

    if (!name) return null;

    // Extract festival URL
    const websiteUrl =
      $el.find("h2 a").first().attr("href") ||
      $el.find("h3 a").first().attr("href") ||
      $el.find(".entry-title a").first().attr("href") ||
      $el.find("a.festival-name").first().attr("href") ||
      $el.find("a").first().attr("href") ||
      null;

    // Extract location text — look for location-specific elements
    const locationText =
      $el.find("[class*='location']").first().text().trim() ||
      $el.find("[class*='venue']").first().text().trim() ||
      $el.find("[class*='city']").first().text().trim() ||
      $el.find(".festival-location").first().text().trim() ||
      $el.find("address").first().text().trim() ||
      "";

    const { city, country } = parseLocation(locationText);

    // Extract dates
    const dateText =
      $el.find("[class*='date']").first().text().trim() ||
      $el.find("time").first().text().trim() ||
      $el.find("[class*='when']").first().text().trim() ||
      $el.find(".festival-date").first().text().trim() ||
      "";

    const { startDate, endDate } = parseDateRange(dateText);

    // Extract genres/tags
    const genres: string[] = [];
    $el.find("[class*='genre'], [class*='tag'], .festival-genre, .tag").each(
      (_, tagEl) => {
        const tag = $(tagEl).text().trim().toLowerCase();
        if (tag && tag.length < 50) {
          genres.push(tag);
        }
      }
    );

    // Also look for genre info in comma-separated format
    const genreText =
      $el.find("[class*='genres']").first().text().trim() ||
      $el.find("[class*='category']").first().text().trim() ||
      "";
    if (genreText && genres.length === 0) {
      genreText.split(/[,/]/).forEach((g) => {
        const trimmed = g.trim().toLowerCase();
        if (trimmed && trimmed.length < 50) {
          genres.push(trimmed);
        }
      });
    }

    // Raw HTML for re-parsing later
    const rawHtml = $el.html() || "";

    const sourceId = generateSourceId(name, city);

    return {
      source: this.source,
      sourceId,
      name,
      city,
      state: null,
      country,
      startDate,
      endDate,
      genres: genres.length > 0 ? [...new Set(genres)] : [],
      eventType: "festival",
      lineup: [],
      applicationUrl: null,
      applicationDeadline: null,
      websiteUrl: websiteUrl ? this.resolveUrl(websiteUrl) : null,
      bookingEmail: null,
      status: "active",
      rawData: { html: rawHtml, scrapedAt: new Date().toISOString() },
    };
  }

  /**
   * Check if the page has a "next page" link for pagination.
   */
  private hasNextPage(html: string): boolean {
    const $ = cheerio.load(html);

    // Common WordPress pagination patterns
    const nextLink =
      $("a.next").length > 0 ||
      $(".nav-links a.next").length > 0 ||
      $(".pagination a.next").length > 0 ||
      $(".nav-previous a").length > 0 ||
      $("a[rel='next']").length > 0 ||
      $(".pager .next a").length > 0 ||
      $(".navigation a:contains('Next')").length > 0 ||
      $(".navigation a:contains('next')").length > 0 ||
      $("a:contains('Next Page')").length > 0 ||
      $("a.pagination-next").length > 0 ||
      $(".wp-pagenavi a.nextpostslink").length > 0;

    return nextLink;
  }

  /**
   * Resolve relative URLs to absolute.
   */
  private resolveUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  }
}
