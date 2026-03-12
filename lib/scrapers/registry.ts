import type { BaseScraper } from "./base";

/**
 * Registry of available scrapers.
 * Add new scrapers here as they are built.
 */
const scraperFactories: Record<string, () => BaseScraper> = {
  // Will be populated as scrapers are built:
  // "indie_on_the_move": () => new IndieOnTheMoveScraper(),
  // "songkick": () => new SongkickScraper(),
  // "music_festival_wizard": () => new MusicFestivalWizardScraper(),
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
