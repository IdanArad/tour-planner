# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tour Planner — a SaaS platform for bands, managers, and labels to discover venues/festivals, manage booking outreach, and plan tours across Europe (and beyond). Replaces spreadsheets and scattered emails with a unified CRM + automation engine.

GitHub: https://github.com/IdanArad/tour-planner

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all Playwright E2E tests
npm run test:smoke   # Smoke tests (pages load correctly)
npm run test:settings # Settings page tests
npm run test:crud    # CRUD form tests
```

E2E tests require `TEST_EMAIL` and `TEST_PASSWORD` env vars and a running dev server.

## Stack

- **Next.js 16** with App Router (`/app` directory)
- **React 19**, **TypeScript** (strict mode)
- **Tailwind CSS v4** (via PostCSS plugin)
- **shadcn/ui** (base-nova style, lucide-react icons, NOT Radix — uses @base-ui/react)
- **framer-motion** + **@tsparticles** for sparkles effect
- **Supabase** (PostgreSQL + Auth + RLS + Storage) for multi-tenant persistence
- **Claude API** (Anthropic SDK) for AI pitch generation and venue scoring (planned)
- **Resend** for email sending + webhook tracking (planned)
- Path alias: `@/*` maps to project root

## Architecture

- `app/(dashboard)/` — route group (sidebar layout, no `/dashboard` in URL)
- `app/(auth)/` — login/signup pages (minimal centered layout)
- `app/layout.tsx` — root layout with `<StoreProvider>`
- `lib/store.ts` — React Context fetching from Supabase with optimistic updates
- `lib/queries/` — Server-side data fetching (getShows, getVenues, etc.)
- `lib/actions/` — Server Actions for mutations (addShow, updateVenue, etc.)
- `lib/supabase/` — Supabase clients (browser, server, admin) + types
- `proxy.ts` — Auth session refresh + route protection (Next.js 16 proxy convention)
- Types/interfaces centralized in `types/index.ts`

## Database

- **Supabase** with multi-tenant RLS (all domain tables scoped by `org_id`)
- Migrations in `supabase/migrations/` (001–005)
- Seed data in `supabase/seed.sql`
- Excel research data import via `scripts/import-excel-data.py`
- DB columns are snake_case; mapper functions in store.ts convert to camelCase for the app

## Data Model

- **Organization** → **Membership** → **Profile** (multi-tenant, role-based)
- **Artist** → **Tour** → **Show** (with venue, type, status lifecycle)
- **Venue** → **Contact** (people at the venue)
- **Reachout** (outreach tracking, linked to venue + contact + optional tour)
- **DiscoveredVenue** / **DiscoveredEvent** (global, scraped/imported data)
- **EmailAccount** → **EmailTemplate** → **EmailMessage** (automation)
- **AutomationRule** / **ActivityLog** (rules engine + audit trail)
- Show status flow: idea → pitched → hold → confirmed → advanced → played | cancelled
- Reachout status flow: drafted → sent → replied → follow_up → no_response → declined | booked

## Code Style

- Functional components only, named exports preferred
- Use `@/` import alias for all non-relative imports
- Prefer Server Actions over API routes for mutations
- Keep components small — extract when a file exceeds ~150 lines

## Key Conventions

- Server Actions in `lib/actions/` use explicit parameter types (not Database generics)
- Update functions accept `Record<string, unknown>` for flexibility
- Store provides `{ state, dispatch, loading }` — loading state is for initial fetch
- `data/mock-data.ts` is orphaned — all data now comes from Supabase
