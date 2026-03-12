---
paths:
  - "lib/store.ts"
  - "lib/queries/**/*.ts"
  - "lib/actions/**/*.ts"
---

- State managed via React Context in `lib/store.ts`, fetching from Supabase on mount
- Store provides `{ state, dispatch, loading }` — components should show loading state when `loading` is true
- Dispatch does optimistic updates then calls Server Actions; reverts on error
- Selectors: `getUpcomingShows`, `getReachoutsByStatus`, `getVenueById`, `getReachoutStats`, etc.
- Queries in `lib/queries/` are server-side only (use `createClient` from `@/lib/supabase/server`)
- Actions in `lib/actions/` use `"use server"` directive, explicit parameter types, `revalidatePath` after mutations
- DB columns are snake_case; mapper functions in store.ts convert to camelCase
- `data/mock-data.ts` is orphaned — never import from it
