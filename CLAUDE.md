# CLAUDE.md

## Project

Tour Planner — a web app for bands to plan and manage tour dates. Long-term goal: a SaaS product for labels and artists.

GitHub: https://github.com/IdanArad/tour-planner

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner yet — plan to add Vitest + Playwright when needed.

## Stack

- **Next.js 16** with App Router (`/app` directory)
- **React 19**, **TypeScript** (strict mode)
- **Tailwind CSS v4** (via PostCSS plugin)
- **No database yet** — use local state / in-memory for now. Will add a DB + ORM later.
- Path alias: `@/*` maps to project root

## Architecture

### Routing & Components

- App Router conventions: `app/<route>/page.tsx` for pages, `app/layout.tsx` for layouts
- Server Components by default — only add `"use client"` when needed (event handlers, hooks, browser APIs)
- Shared components go in `components/` at project root
- Route-specific components stay co-located in their route folder

### Code Style

- Functional components only, named exports preferred
- Types/interfaces go in `types/` at project root; co-locate small one-off types in the file that uses them
- Use `@/` import alias for all non-relative imports
- Prefer Server Actions over API routes for mutations
- Keep components small — extract when a file exceeds ~150 lines

### Data Model (planned core entities)

- **Tour** — a collection of shows (name, artist, date range, status)
- **Show** — a single performance (date, venue, city, status, notes)
- **Venue** — a location (name, city, country, capacity)
- **Artist** — a band or solo act (name, genre, contact info)

### UI Patterns

- Tailwind utility classes directly on elements — no CSS modules or styled-components
- Dark mode via `prefers-color-scheme` (already in globals.css)
- Use native `<form>` with Server Actions where possible
- Loading states: use Next.js `loading.tsx` convention
- Errors: use Next.js `error.tsx` boundaries
