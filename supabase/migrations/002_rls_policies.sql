-- Helper functions for RLS

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM memberships WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION user_has_role(target_org_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = ANY(allowed_roles)
  );
$$;

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "anyone_can_create_org" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "org_owners_update" ON organizations
  FOR UPDATE USING (user_has_role(id, ARRAY['owner']));

-- Memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_org_memberships" ON memberships
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "admins_manage_memberships_insert" ON memberships
  FOR INSERT WITH CHECK (
    user_has_role(org_id, ARRAY['owner','admin'])
    OR user_id = auth.uid()  -- allow self-insert during signup
  );

CREATE POLICY "admins_manage_memberships_update" ON memberships
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin']));

CREATE POLICY "admins_manage_memberships_delete" ON memberships
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Domain tables: apply standard org-scoped policies

-- Artists
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON artists
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON artists
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON artists
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON artists
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON venues
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON venues
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON venues
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON venues
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON contacts
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON contacts
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON contacts
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON contacts
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Tours
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON tours
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON tours
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON tours
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON tours
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Shows
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON shows
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON shows
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON shows
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON shows
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));

-- Reachouts
ALTER TABLE reachouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON reachouts
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_writers_insert" ON reachouts
  FOR INSERT WITH CHECK (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_writers_update" ON reachouts
  FOR UPDATE USING (user_has_role(org_id, ARRAY['owner','admin','agent']));
CREATE POLICY "org_admins_delete" ON reachouts
  FOR DELETE USING (user_has_role(org_id, ARRAY['owner','admin']));
