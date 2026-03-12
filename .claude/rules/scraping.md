---
paths:
  - "lib/scrapers/**/*.ts"
  - "app/api/cron/**/*.ts"
  - "app/api/scrape/**/*.ts"
---

- Scrapers use Cheerio + native fetch (no Puppeteer) — must work in serverless
- All scrapers extend `BaseScraper` class in `lib/scrapers/base.ts`
- Rate limiting: 1 req/3s for HTML scraping, respect API rate limits
- Anti-blocking: rotate User-Agents, respect robots.txt, exponential backoff on 429s
- Store raw HTML/JSON in `raw_data` jsonb column for re-parsing without re-scraping
- Cron routes verify `CRON_SECRET` header for auth
- Scraped data goes into `discovered_venues` and `discovered_events` (global, not org-scoped)
- Use `createAdminClient()` (service role) in cron/scraping routes
