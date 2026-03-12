---
paths:
  - "app/**/*.tsx"
---

- Uses Next.js App Router convention
- `app/(dashboard)/` is a route group — no `/dashboard` prefix in URLs
- New routes go in `app/(dashboard)/<route>/page.tsx`
- Server Components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- Use `loading.tsx` for loading states, `error.tsx` for error boundaries
