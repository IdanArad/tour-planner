import * as cheerio from "cheerio";
import {
  BaseScraper,
  generateSourceId,
  type ScrapedEvent,
  type ScrapedVenue,
} from "@/lib/scrapers/base";
import { fetchWithRetry } from "@/lib/scrapers/utils/rate-limiter";

// ---------------------------------------------------------------------------
// Source definitions
// ---------------------------------------------------------------------------

interface FestivalSource {
  name: string;
  url: string;
  parse: (html: string, baseUrl: string) => ScrapedEvent[];
}

// ---------------------------------------------------------------------------
// Shared date / location helpers
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, number> = {
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

/**
 * Best-effort conversion of a month string + day + year into YYYY-MM-DD.
 * Returns null when any component is unrecognisable.
 */
function toISODate(
  monthStr: string,
  dayStr: string,
  yearStr: string,
): string | null {
  const monthIndex = MONTH_MAP[monthStr.toLowerCase()];
  if (monthIndex === undefined) return null;
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  if (isNaN(day) || isNaN(year)) return null;
  const d = new Date(year, monthIndex, day);
  return d.toISOString().split("T")[0];
}

/**
 * Attempt to parse a wide variety of human-readable date strings into
 * { startDate, endDate }. Returns nulls when unparseable.
 *
 * Recognised patterns (non-exhaustive):
 *   "5 - 7 June 2026"
 *   "5-7 Jun 2026"
 *   "Jun 5 - 7, 2026"
 *   "June 5 - June 7, 2026"
 *   "Jun 5, 2026 - Jun 7, 2026"
 *   "5 Jun 2026"
 *   "June 5, 2026"
 *   "05.06.2026 - 07.06.2026"  (DD.MM.YYYY)
 *   "2026-06-05"                (ISO)
 */
function parseDateRange(raw: string): {
  startDate: string | null;
  endDate: string | null;
} {
  if (!raw) return { startDate: null, endDate: null };
  const text = raw.replace(/\s+/g, " ").trim();

  // ISO single date "2026-06-05"
  const isoSingle = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSingle) {
    return { startDate: text, endDate: null };
  }

  // DD.MM.YYYY - DD.MM.YYYY
  const dotRange = text.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  );
  if (dotRange) {
    const [, sd, sm, sy, ed, em, ey] = dotRange;
    const s = `${sy}-${sm.padStart(2, "0")}-${sd.padStart(2, "0")}`;
    const e = `${ey}-${em.padStart(2, "0")}-${ed.padStart(2, "0")}`;
    return { startDate: s, endDate: e };
  }

  // DD.MM.YYYY single
  const dotSingle = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotSingle) {
    const [, d, m, y] = dotSingle;
    return {
      startDate: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
      endDate: null,
    };
  }

  // "Day - Day Month Year"  e.g. "5 - 7 June 2026"
  const dayRangeBefore = text.match(
    /^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})$/,
  );
  if (dayRangeBefore) {
    const [, sd, ed, month, year] = dayRangeBefore;
    return {
      startDate: toISODate(month, sd, year),
      endDate: toISODate(month, ed, year),
    };
  }

  // "Day Month - Day Month Year"  e.g. "28 June - 1 July 2026"
  const crossMonthEuro = text.match(
    /^(\d{1,2})\s+(\w+)\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})$/,
  );
  if (crossMonthEuro) {
    const [, sd, sm, ed, em, year] = crossMonthEuro;
    return {
      startDate: toISODate(sm, sd, year),
      endDate: toISODate(em, ed, year),
    };
  }

  // "Day Month Year"  e.g. "5 June 2026"
  const singleEuro = text.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (singleEuro) {
    const [, d, m, y] = singleEuro;
    return { startDate: toISODate(m, d, y), endDate: null };
  }

  // "Month Day - Month Day, Year"  e.g. "Jun 5 - Jun 7, 2026"
  const crossMonthUS = text.match(
    /^(\w+)\s+(\d{1,2})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})$/,
  );
  if (crossMonthUS) {
    const [, sm, sd, em, ed, year] = crossMonthUS;
    return {
      startDate: toISODate(sm, sd, year),
      endDate: toISODate(em, ed, year),
    };
  }

  // "Month Day - Day, Year"  e.g. "June 5-7, 2026"
  const sameMonthUS = text.match(
    /^(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})$/,
  );
  if (sameMonthUS) {
    const [, month, sd, ed, year] = sameMonthUS;
    return {
      startDate: toISODate(month, sd, year),
      endDate: toISODate(month, ed, year),
    };
  }

  // "Month Day, Year - Month Day, Year"
  const fullRangeUS = text.match(
    /^(\w+)\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})$/,
  );
  if (fullRangeUS) {
    const [, sm, sd, sy, em, ed, ey] = fullRangeUS;
    return {
      startDate: toISODate(sm, sd, sy),
      endDate: toISODate(em, ed, ey),
    };
  }

  // "Month Day, Year"  e.g. "June 5, 2026"
  const singleUS = text.match(/^(\w+)\s+(\d{1,2}),?\s*(\d{4})$/);
  if (singleUS) {
    const [, m, d, y] = singleUS;
    return { startDate: toISODate(m, d, y), endDate: null };
  }

  return { startDate: null, endDate: null };
}

/**
 * Split a location string like "Berlin, Germany" or "Barcelona, Catalonia, Spain"
 * into { city, country }.
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
    return { city: parts[0] || null, country: parts[parts.length - 1] || null };
  }
  if (parts.length === 1) {
    return { city: null, country: parts[0] || null };
  }
  return { city: null, country: null };
}

/**
 * Resolve a possibly-relative URL against a base URL.
 */
function resolveUrl(href: string, baseUrl: string): string {
  if (!href) return href;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/**
 * Extract text from an element, falling back through a list of selectors.
 */
function textFrom(
  $: cheerio.CheerioAPI,
  $el: ReturnType<cheerio.CheerioAPI>,
  selectors: string[],
): string {
  for (const sel of selectors) {
    const t = $el.find(sel).first().text().trim();
    if (t) return t;
  }
  return "";
}

/**
 * Extract an href from an element, falling back through selectors.
 */
function hrefFrom(
  $: cheerio.CheerioAPI,
  $el: ReturnType<cheerio.CheerioAPI>,
  selectors: string[],
): string | null {
  for (const sel of selectors) {
    const h = $el.find(sel).first().attr("href");
    if (h) return h;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Source 1 — festivall.eu
// ---------------------------------------------------------------------------

function parseFestivallEu(html: string, baseUrl: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // Festivall.eu lists festivals in card-style elements. We try several
  // plausible selectors so we survive minor layout changes.
  const cardSelectors = [
    ".festival-card",
    ".festival-item",
    ".festival-list-item",
    "[class*='festival'] [class*='card']",
    ".card",
    "article",
    ".event-card",
    ".event-item",
    ".list-item",
    // Table rows as fallback (some listing sites use tables)
    "table tbody tr",
  ];

  let $cards: ReturnType<cheerio.CheerioAPI> | null = null;
  for (const sel of cardSelectors) {
    const matches = $(sel);
    if (matches.length > 0) {
      $cards = matches;
      break;
    }
  }

  if (!$cards || $cards.length === 0) {
    console.warn(
      "[FestivalAggregator] festivall.eu: no festival cards found — layout may have changed",
    );
    return events;
  }

  $cards.each((_, el) => {
    try {
      const $el = $(el);

      // Festival name
      const name = textFrom($, $el, [
        "h2 a", "h3 a", "h4 a",
        "h2", "h3", "h4",
        "[class*='title'] a", "[class*='title']",
        "[class*='name'] a", "[class*='name']",
        "a.title", "a",
        "td:first-child a", "td:first-child",
      ]);
      if (!name) return; // skip empty cards

      // Location
      const locationText = textFrom($, $el, [
        "[class*='location']",
        "[class*='place']",
        "[class*='city']",
        "[class*='country']",
        "[class*='venue']",
        "address",
        ".meta [class*='loc']",
        "td:nth-child(2)",
      ]);
      const { city, country } = parseLocation(locationText);

      // Dates
      const dateText = textFrom($, $el, [
        "time",
        "[class*='date']",
        "[class*='when']",
        "[datetime]",
        ".meta [class*='date']",
        "td:nth-child(3)",
      ]);
      // Also check <time datetime="..."> attribute
      const timeAttr =
        $el.find("time").first().attr("datetime") ||
        $el.find("[datetime]").first().attr("datetime") ||
        "";
      const { startDate, endDate } = parseDateRange(dateText || timeAttr);

      // Genres / tags
      const genres: string[] = [];
      $el
        .find(
          "[class*='genre'], [class*='tag'], [class*='category'], .badge, .chip, .label",
        )
        .each((_, tagEl) => {
          const tag = $(tagEl).text().trim().toLowerCase();
          if (tag && tag.length < 60) genres.push(tag);
        });
      // Fallback: comma-separated genre text
      const genreText = textFrom($, $el, [
        "[class*='genres']",
        "[class*='categories']",
        "[class*='style']",
      ]);
      if (genreText && genres.length === 0) {
        genreText.split(/[,/|]/).forEach((g) => {
          const t = g.trim().toLowerCase();
          if (t && t.length < 60) genres.push(t);
        });
      }

      // Website URL
      const href =
        hrefFrom($, $el, [
          "h2 a", "h3 a", "h4 a",
          "[class*='title'] a",
          "[class*='name'] a",
          "a[class*='link']",
          "a[class*='website']",
          "a",
        ]);
      const websiteUrl = href ? resolveUrl(href, baseUrl) : null;

      // Raw snippet for debugging / re-parse
      const rawHtml = ($el.html() || "").substring(0, 2000);

      events.push({
        source: "festival_aggregator",
        sourceId: generateSourceId(name, city),
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
        websiteUrl,
        bookingEmail: null,
        status: "active",
        rawData: {
          sourceUrl: baseUrl,
          html: rawHtml,
          scrapedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn(
        "[FestivalAggregator] festivall.eu: failed to parse a card:",
        err instanceof Error ? err.message : String(err),
      );
    }
  });

  return events;
}

// ---------------------------------------------------------------------------
// Source 2 — yourope.org (European Festival Awards / festival map)
// ---------------------------------------------------------------------------

/**
 * Yourope's festival map page may embed festival data as JSON within
 * script tags (common for map-based UIs) or render it as HTML list items.
 * We try the JSON approach first, then fall back to HTML parsing.
 */
function parseYouropeOrg(html: string, baseUrl: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];

  // ---- Attempt 1: extract inline JSON data from script tags ----
  // Many map-based pages inject marker data as a JS variable/JSON array.
  const jsonPatterns = [
    // var festivals = [ ... ]
    /(?:var|let|const)\s+\w*(?:festival|marker|event|data)\w*\s*=\s*(\[[\s\S]*?\]);/i,
    // data-festivals='[...]'  or data-markers='[...]'
    /data-(?:festival|marker|event)s?=["'](\[[\s\S]*?\])["']/i,
    // JSON.parse('[...]')
    /JSON\.parse\(\s*'(\[[\s\S]*?\])'\s*\)/i,
  ];

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    try {
      const data: unknown[] = JSON.parse(match[1]);
      if (!Array.isArray(data) || data.length === 0) continue;

      for (const item of data) {
        try {
          if (typeof item !== "object" || item === null) continue;
          const rec = item as Record<string, unknown>;

          const name = String(
            rec.name ?? rec.title ?? rec.festival_name ?? rec.label ?? "",
          ).trim();
          if (!name) continue;

          const cityRaw = String(
            rec.city ?? rec.location ?? rec.place ?? "",
          ).trim();
          const countryRaw = String(
            rec.country ?? rec.country_name ?? "",
          ).trim();

          const { city: parsedCity, country: parsedCountry } = cityRaw.includes(",")
            ? parseLocation(cityRaw)
            : { city: cityRaw || null, country: null };

          const city = parsedCity || null;
          const country = countryRaw || parsedCountry || null;

          // Dates
          const startRaw = String(
            rec.start_date ?? rec.startDate ?? rec.date_start ?? rec.date ?? "",
          ).trim();
          const endRaw = String(
            rec.end_date ?? rec.endDate ?? rec.date_end ?? "",
          ).trim();
          const { startDate } = parseDateRange(startRaw);
          const endParsed = parseDateRange(endRaw);
          const endDate = endParsed.startDate; // single date parse

          // Genre
          const genreRaw = String(
            rec.genre ?? rec.genres ?? rec.category ?? rec.style ?? "",
          ).trim();
          const genres = genreRaw
            ? genreRaw.split(/[,/|]/).map((g) => g.trim().toLowerCase()).filter(Boolean)
            : [];

          // URL
          const websiteUrl = String(
            rec.website ?? rec.url ?? rec.link ?? rec.website_url ?? "",
          ).trim() || null;

          events.push({
            source: "festival_aggregator",
            sourceId: generateSourceId(name, city),
            name,
            city,
            state: null,
            country,
            startDate: startDate ?? (startRaw || null),
            endDate: endDate ?? (endRaw || null),
            genres: genres.length > 0 ? [...new Set(genres)] : [],
            eventType: "festival",
            lineup: [],
            applicationUrl: null,
            applicationDeadline: null,
            websiteUrl,
            bookingEmail: null,
            status: "active",
            rawData: JSON.parse(JSON.stringify({
              sourceUrl: baseUrl,
              json: rec,
              scrapedAt: new Date().toISOString(),
            })),
          });
        } catch {
          // Skip malformed individual records
        }
      }

      // If we found festivals via JSON, return them directly.
      if (events.length > 0) return events;
    } catch {
      // JSON parse failed — try next pattern or fall back to HTML
    }
  }

  // ---- Attempt 2: parse HTML ----
  const $ = cheerio.load(html);

  const cardSelectors = [
    ".festival-item",
    ".festival-card",
    ".festival",
    "[class*='festival']",
    ".map-item",
    ".marker-info",
    ".event-item",
    ".event-card",
    "article",
    ".card",
    "li.item",
    "table tbody tr",
  ];

  let $cards: ReturnType<cheerio.CheerioAPI> | null = null;
  for (const sel of cardSelectors) {
    const matches = $(sel);
    if (matches.length > 0) {
      $cards = matches;
      break;
    }
  }

  if (!$cards || $cards.length === 0) {
    console.warn(
      "[FestivalAggregator] yourope.org: no festival elements found — layout may have changed",
    );
    return events;
  }

  $cards.each((_, el) => {
    try {
      const $el = $(el);

      const name = textFrom($, $el, [
        "h2 a", "h3 a", "h4 a",
        "h2", "h3", "h4",
        "[class*='title'] a", "[class*='title']",
        "[class*='name']",
        "a", "strong",
        "td:first-child a", "td:first-child",
      ]);
      if (!name) return;

      const locationText = textFrom($, $el, [
        "[class*='location']",
        "[class*='place']",
        "[class*='country']",
        "[class*='city']",
        "address",
        "td:nth-child(2)",
      ]);
      const { city, country } = parseLocation(locationText);

      const dateText = textFrom($, $el, [
        "time",
        "[class*='date']",
        "[class*='when']",
        "[datetime]",
        "td:nth-child(3)",
      ]);
      const timeAttr =
        $el.find("time").first().attr("datetime") ||
        $el.find("[datetime]").first().attr("datetime") ||
        "";
      const { startDate, endDate } = parseDateRange(dateText || timeAttr);

      const genres: string[] = [];
      $el
        .find("[class*='genre'], [class*='tag'], [class*='category'], .badge")
        .each((_, tagEl) => {
          const tag = $(tagEl).text().trim().toLowerCase();
          if (tag && tag.length < 60) genres.push(tag);
        });

      const href = hrefFrom($, $el, [
        "h2 a", "h3 a", "h4 a",
        "[class*='title'] a",
        "a[class*='website']",
        "a",
      ]);
      const websiteUrl = href ? resolveUrl(href, baseUrl) : null;

      const rawHtml = ($el.html() || "").substring(0, 2000);

      events.push({
        source: "festival_aggregator",
        sourceId: generateSourceId(name, city),
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
        websiteUrl,
        bookingEmail: null,
        status: "active",
        rawData: {
          sourceUrl: baseUrl,
          html: rawHtml,
          scrapedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn(
        "[FestivalAggregator] yourope.org: failed to parse a card:",
        err instanceof Error ? err.message : String(err),
      );
    }
  });

  return events;
}

// ---------------------------------------------------------------------------
// Source registry
// ---------------------------------------------------------------------------

const SOURCES: FestivalSource[] = [
  {
    name: "festivall.eu",
    url: "https://festivall.eu/festivals/europe",
    parse: parseFestivallEu,
  },
  {
    name: "yourope.org",
    url: "https://www.yourope.org/festival-map/",
    parse: parseYouropeOrg,
  },
];

// ---------------------------------------------------------------------------
// Scraper class
// ---------------------------------------------------------------------------

export class FestivalAggregatorScraper extends BaseScraper {
  constructor() {
    // 4-second interval between requests (generous rate limit for external sites)
    super("festival_aggregator", 4000);
  }

  async scrapeVenues(): Promise<ScrapedVenue[]> {
    // This scraper is festival/event-focused, not venue-focused
    return [];
  }

  async scrapeEvents(): Promise<ScrapedEvent[]> {
    const allEvents: ScrapedEvent[] = [];

    for (const source of SOURCES) {
      try {
        const events = await this.scrapeSource(source);
        allEvents.push(...events);
        console.log(
          `[FestivalAggregator] ${source.name}: scraped ${events.length} events`,
        );
      } catch (err) {
        // Source failure is non-fatal — continue with remaining sources
        console.warn(
          `[FestivalAggregator] ${source.name}: scrape failed —`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    // Deduplicate by sourceId (same festival may appear on multiple sources)
    const seen = new Set<string>();
    const dedupedEvents: ScrapedEvent[] = [];
    for (const event of allEvents) {
      if (!seen.has(event.sourceId)) {
        seen.add(event.sourceId);
        dedupedEvents.push(event);
      }
    }

    console.log(
      `[FestivalAggregator] total: ${dedupedEvents.length} unique events from ${SOURCES.length} sources`,
    );

    return dedupedEvents;
  }

  /**
   * Fetch and parse a single source. Respects rate limiting between requests.
   */
  private async scrapeSource(source: FestivalSource): Promise<ScrapedEvent[]> {
    await this.rateLimiter.acquire();

    const response = await fetchWithRetry(source.url);

    if (!response.ok) {
      console.warn(
        `[FestivalAggregator] ${source.name}: HTTP ${response.status} for ${source.url}`,
      );
      return [];
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      console.warn(
        `[FestivalAggregator] ${source.name}: response body too short (${html.length} chars)`,
      );
      return [];
    }

    return source.parse(html, source.url);
  }
}
