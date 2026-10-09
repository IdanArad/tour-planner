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
npm run test:tours   # Tours page tests
npm run test:email   # Outreach email tests (skipped unless run via test:local)
npm run test:local   # Full suite against a local Supabase stack (needs Docker) — what CI runs
```

`npm run test:local` starts Supabase locally, applies migrations + seed, and creates its own test user; pass Playwright args after `--` (e.g. `npm run test:local -- tours`). It also points outreach email at a local SMTP sink (`e2e/helpers/fake-smtp.ts`), so the email tests never send real mail, and refuses to start while something is already serving port 3000. The plain `npm run test*` scripts use whatever Supabase `.env.local` points at and need `TEST_EMAIL` / `TEST_PASSWORD` there. CI (`.github/workflows/e2e.yml`) runs `test:local` on every PR and push to main.

## Stack

- **Next.js 16** with App Router (`/app` directory)
- **React 19**, **TypeScript** (strict mode)
- **Tailwind CSS v4** (via PostCSS plugin)
- **shadcn/ui** (base-nova style, lucide-react icons, NOT Radix — uses @base-ui/react)
- **framer-motion** + **@tsparticles** for sparkles effect
- **Supabase** (PostgreSQL + Auth + RLS + Storage) for multi-tenant persistence
- **Claude API** (Anthropic SDK) for AI pitch generation and venue scoring
- **Email**: all sending goes through `sendMail()` in `lib/email/client.ts` — SMTP (nodemailer) when `SMTP_USER`/`SMTP_HOST` is set, otherwise Resend. `EMAIL_FROM` sets the sender. For Google Workspace: `SMTP_USER=<mailbox>`, `SMTP_PASSWORD=<app password>` (host/port default to smtp.gmail.com:465). Delivery/open tracking only exists on the Resend path (webhook).
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
