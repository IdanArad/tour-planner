import type { BaseScraper } from "./base";
import { MusicFestivalWizardScraper } from "./music-festival-wizard";
import { SetlistfmScraper } from "./setlistfm";

/**
 * Registry of available scrapers.
 * Add new scrapers here as they are built.
 */
const scraperFactories: Record<string, () => BaseScraper> = {
  music_festival_wizard: () => new MusicFestivalWizardScraper(),
  setlistfm: () => new SetlistfmScraper(),
};

export function getScraper(sourceName: string): BaseScraper | null {
  const factory = scraperFactories[sourceName];
  return factory ? factory() : null;
}

export function getAvailableScrapers(): string[] {
  return Object.keys(scraperFactories);
}

export function registerScraper(
  name: string,
  factory: () => BaseScraper
): void {
  scraperFactories[name] = factory;
}
