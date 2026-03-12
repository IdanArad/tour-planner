-- Migration 003: Artist enrichment + Discovery engine tables

-- Enrich artists table
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS spotify_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS genres text[],
  ADD COLUMN IF NOT EXISTS hometown text,
  ADD COLUMN IF NOT EXISTS monthly_listeners integer,
  ADD COLUMN IF NOT EXISTS draw_estimate jsonb;

-- Global discovered venues
CREATE TABLE discovered_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id text,
  name text NOT NULL,
  city text,
  state text,
  country text,
  capacity integer,
  genres text[],
  venue_type text,
  website_url text,
  booking_email text,
  booking_contact text,
  phone text,
  lat double precision,
  lng double precision,
  raw_data jsonb,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_discovered_venues_dedup
  ON discovered_venues (source, COALESCE(source_id, name || '|' || COALESCE(city, '')));

-- Global discovered events/festivals
CREATE TABLE discovered_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id text,
  name text NOT NULL,
  discovered_venue_id uuid REFERENCES discovered_venues(id) ON DELETE SET NULL,
  city text,
  state text,
  country text,
  start_date date,
  end_date date,
  genres text[],
  event_type text,
  lineup text[],
  application_url text,
  application_deadline date,
  website_url text,
  booking_email text,
  status text DEFAULT 'active',
  raw_data jsonb,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scraping infrastructure
CREATE TABLE scrape_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  base_url text,
  scraper_type text NOT NULL,
  config jsonb DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_interval_hours integer NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES scrape_sources(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  job_type text NOT NULL DEFAULT 'full',
  config jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  items_found integer DEFAULT 0,
  items_new integer DEFAULT 0,
  error_log text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Opportunity matching
CREATE TABLE opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  discovered_venue_id uuid REFERENCES discovered_venues(id) ON DELETE CASCADE,
  discovered_event_id uuid REFERENCES discovered_events(id) ON DELETE CASCADE,
  match_score integer NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reasons jsonb,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','reviewing','interested','dismissed','actioned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discovered_venue_id IS NOT NULL OR discovered_event_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_discovered_venues_source ON discovered_venues(source);
CREATE INDEX idx_discovered_venues_country ON discovered_venues(country);
CREATE INDEX idx_discovered_venues_city ON discovered_venues(city);
CREATE INDEX idx_discovered_venues_genres ON discovered_venues USING gin(genres);

CREATE INDEX idx_discovered_events_source ON discovered_events(source);
CREATE INDEX idx_discovered_events_country ON discovered_events(country);
CREATE INDEX idx_discovered_events_dates ON discovered_events(start_date, end_date);
CREATE INDEX idx_discovered_events_genres ON discovered_events USING gin(genres);

CREATE INDEX idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);

CREATE INDEX idx_opportunity_matches_org ON opportunity_matches(org_id);
CREATE INDEX idx_opportunity_matches_artist ON opportunity_matches(artist_id);
CREATE INDEX idx_opportunity_matches_status ON opportunity_matches(status);
CREATE INDEX idx_opportunity_matches_score ON opportunity_matches(match_score DESC);

-- RLS
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view matches"
ON opportunity_matches FOR SELECT
USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Agents+ can manage matches"
ON opportunity_matches FOR ALL
USING (user_has_role(org_id, ARRAY['agent','admin','owner']));

-- Discovery tables read access
ALTER TABLE discovered_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read discovered venues"
ON discovered_venues FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read discovered events"
ON discovered_events FOR SELECT
USING (auth.role() = 'authenticated');