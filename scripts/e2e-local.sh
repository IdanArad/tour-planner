#!/usr/bin/env bash
# Runs the Playwright suite against a local Supabase stack (requires Docker).
# Migrations and supabase/seed.sql are applied on first start; nothing touches
# the hosted project. Extra args are passed to Playwright, e.g. `npm run test:local -- tours`.
set -euo pipefail
cd "$(dirname "$0")/.."

npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,studio,postgres-meta,supavisor

eval "$(npx supabase status -o env \
  --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
  --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY 2>/dev/null \
  | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=' \
  | sed 's/^/export /')"

export TEST_EMAIL="e2e@tour-planner.test"
export TEST_PASSWORD="e2e-local-password"

node scripts/e2e-seed-user.mjs
npx playwright test "$@"
