---
name: scrape
description: Build or test a web scraper for venue/festival discovery
user_invocable: true
---

# Scraper Skill

Build or test a web scraper for the Tour Planner discovery engine.

## Usage:
- `/scrape <source-name>` — Build a new scraper for the given source
- `/scrape test <source-name>` — Test an existing scraper

## Steps for building:

1. Read `lib/scrapers/base.ts` to understand the BaseScraper interface
2. Fetch the target website to understand its HTML structure
3. Create the scraper in `lib/scrapers/<source-name>.ts`
4. Register it in `lib/scrapers/registry.ts`
5. Follow constraints: rate limiting (1 req/3s), User-Agent rotation, error handling
6. Store raw HTML in `raw_data` jsonb for re-parsing
7. Test with a small batch first
