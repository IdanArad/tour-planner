-- Multi-tenancy tables

CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text NOT NULL DEFAULT 'free',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text NOT NULL,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'agent'
              CHECK (role IN ('owner', 'admin', 'agent', 'artist')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- Domain tables (all org-scoped)

CREATE TABLE artists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  genre           text,
  contact_email   text,
  contact_phone   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  city        text NOT NULL,
  state       text,
  country     text NOT NULL DEFAULT 'US',
  capacity    integer,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id    uuid REFERENCES venues(id) ON DELETE SET NULL,
  name        text NOT NULL,
  role        text,
  email       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id   uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  name        text NOT NULL,
  start_date  date,
  end_date    date,
  status      text NOT NULL DEFAULT 'planning'
              CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tour_id       uuid REFERENCES tours(id) ON DELETE SET NULL,
  venue_id      uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  artist_id     uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  reachout_id   uuid,
  date          date NOT NULL,
  status        text NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea','pitched','hold','confirmed','advanced','played','cancelled')),
  type          text NOT NULL DEFAULT 'headline'
                CHECK (type IN ('headline','opener','co_headline','festival','private')),
  guarantee     numeric(10,2),
  ticket_price  numeric(10,2),
  doors_time    time,
  set_time      time,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reachouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id        uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  tour_id         uuid REFERENCES tours(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'drafted'
                  CHECK (status IN ('drafted','sent','replied','follow_up','no_response','declined','booked')),
  method          text CHECK (method IN ('email','phone','dm','in_person')),
  sent_at         timestamptz,
  last_follow_up  timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Deferred FK for shows.reachout_id
ALTER TABLE shows
  ADD CONSTRAINT shows_reachout_id_fkey
  FOREIGN KEY (reachout_id) REFERENCES reachouts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_artists_org ON artists(org_id);
CREATE INDEX idx_venues_org ON venues(org_id);
CREATE INDEX idx_contacts_org ON contacts(org_id);
CREATE INDEX idx_contacts_venue ON contacts(venue_id);
CREATE INDEX idx_tours_org ON tours(org_id);
CREATE INDEX idx_tours_artist ON tours(artist_id);
CREATE INDEX idx_shows_org ON shows(org_id);
CREATE INDEX idx_shows_tour ON shows(tour_id);
CREATE INDEX idx_shows_venue ON shows(venue_id);
CREATE INDEX idx_shows_artist ON shows(artist_id);
CREATE INDEX idx_shows_date ON shows(date);
CREATE INDEX idx_reachouts_org ON reachouts(org_id);
CREATE INDEX idx_reachouts_venue ON reachouts(venue_id);
CREATE INDEX idx_reachouts_tour ON reachouts(tour_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(org_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
