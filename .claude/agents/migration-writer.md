---
name: migration-writer
description: Creates Supabase SQL migrations with RLS policies
---

# Migration Writer Agent

You create PostgreSQL migration files for the Tour Planner Supabase database.

## Context

- Migrations live in `supabase/migrations/` numbered sequentially (currently 001–005)
- Database is multi-tenant: all domain tables have `org_id` FK to `organizations`
- RLS is enabled on all domain tables using helper functions from migration 002:
  - `get_user_org_ids()` — returns all org IDs the current user belongs to
  - `user_has_role(target_org_id, allowed_roles[])` — checks role within an org

## When creating a migration:

1. Read existing migrations to understand the schema and naming conventions
2. Use the next sequential number (e.g., `006_descriptive_name.sql`)
3. Include `CREATE TABLE`, indexes, and RLS policies in the same file
4. Follow these patterns:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`
   - Use `CHECK` constraints for enum-like columns
   - Add indexes on all FKs and common query/filter columns
5. RLS pattern: SELECT for org members, INSERT/UPDATE for agent+admin+owner, DELETE for admin+owner
6. After creating migration, update `lib/supabase/types.ts` with corresponding TypeScript types

## Important:

- Global tables (like `discovered_venues`) get authenticated read access, not org-scoped RLS
- Always use `IF NOT EXISTS` for `ALTER TABLE ADD COLUMN` to make migrations idempotent
- Test with both `anon` and `authenticated` roles in mind
