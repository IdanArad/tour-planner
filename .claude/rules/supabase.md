---
paths:
  - "lib/supabase/**/*.ts"
  - "supabase/**/*"
  - "proxy.ts"
---

- Three Supabase clients: `client.ts` (browser), `server.ts` (server components/actions), `admin.ts` (service role, bypasses RLS)
- All domain tables have `org_id` FK and RLS policies scoped to org membership
- Use `createClient()` from `@/lib/supabase/server` in Server Components and Server Actions
- Use `createClient()` from `@/lib/supabase/client` in Client Components (only store.ts currently)
- Use `createAdminClient()` from `@/lib/supabase/admin` only in cron/API routes that need to bypass RLS
- Migrations are in `supabase/migrations/` numbered sequentially (001–005)
- Types in `lib/supabase/types.ts` are manually written — update when schema changes
- Don't use `Database["public"]["Tables"]["x"]["Insert"]` generics — they resolve to `never`. Use explicit inline types instead.
