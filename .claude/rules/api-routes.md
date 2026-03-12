---
paths:
  - "app/api/**/*.ts"
---

- Prefer Server Actions for user-initiated mutations (forms, buttons)
- Use API routes only for: cron jobs, webhooks, AI endpoints, and scraping triggers
- Cron routes must verify `Authorization: Bearer ${CRON_SECRET}` header
- Webhook routes (e.g., Resend) must verify webhook signatures
- API routes that bypass RLS use `createAdminClient()` from `@/lib/supabase/admin`
- Return `NextResponse.json()` with appropriate status codes
