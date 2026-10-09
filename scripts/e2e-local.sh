#!/usr/bin/env bash
# Runs the Playwright suite against a local Supabase stack (requires Docker).
# Migrations and supabase/seed.sql are applied on first start; nothing touches
# the hosted project. Extra args are passed to Playwright, e.g. `npm run test:local -- tours`.
set -euo pipefail
cd "$(dirname "$0")/.."

if curl -s -o /dev/null http://localhost:3000; then
  echo "Port 3000 is in use — stop the running dev server first." >&2
  echo "Playwright would reuse it, and it runs with .env.local (hosted Supabase, real mailbox)." >&2
  exit 1
fi

npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,studio,postgres-meta,supavisor

eval "$(npx supabase status -o env \
  --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
  --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY 2>/dev/null \
  | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=' \
  | sed 's/^/export /')"

export TEST_EMAIL="e2e@tour-planner.test"
export TEST_PASSWORD="e2e-local-password"

# Outreach email goes to the SMTP sink that e2e/email.spec.ts starts on this port.
# SMTP_USER/SMTP_PASSWORD are blanked so mailbox credentials in .env.local are never used.
export SMTP_HOST="127.0.0.1"
export SMTP_PORT="2525"
export SMTP_USER=""
export SMTP_PASSWORD=""
export EMAIL_FROM="E2E Sender <sender@tour-planner.test>"

node scripts/e2e-seed-user.mjs
npx playwright test "$@"
