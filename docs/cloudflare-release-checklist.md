# Cloudflare Release Checklist

## Before Deploy

1. Fill in the public non-secret values in `config/profiles/production.json`.
2. Set Cloudflare Worker secrets:
   - `SUPABASE_SECRET_API_KEY`
   - `DASHBOARD_PASSWORD`
   - `DASHBOARD_SESSION_SECRET`
3. Confirm the Supabase project has the current schema applied from `supabase/schema.sql`.
4. Confirm the public anon key only has the expected RLS-backed reads.

## Validate Locally

```bash
env DASHBOARD_PASSWORD=... DASHBOARD_SESSION_SECRET=... SUPABASE_SECRET_API_KEY=... \
  npm run doctor:production
```

```bash
env DASHBOARD_PASSWORD=... DASHBOARD_SESSION_SECRET=... SUPABASE_SECRET_API_KEY=... \
  npm run build
```

```bash
env DASHBOARD_PASSWORD=... DASHBOARD_SESSION_SECRET=... SUPABASE_SECRET_API_KEY=... \
  npm run cf:build
```

## Deploy

```bash
env DASHBOARD_PASSWORD=... DASHBOARD_SESSION_SECRET=... SUPABASE_SECRET_API_KEY=... \
  npm run cf:deploy
```

## Post-Deploy Smoke Tests

1. Load `/` and verify the main decision page renders.
2. Load `/need-help/find` and confirm public hubs and summaries resolve from Supabase.
3. Submit a test item on `/feedback` and verify it lands in `review_queue_items`.
4. Sign in at `/dashboard/login` with email + shared password and verify the dashboard loads.
5. Verify the signed-in user name and role display correctly in the dashboard header.
6. Change a request status in the dashboard and verify the database row updates.
7. Sign out and verify `/dashboard` redirects back to `/dashboard/login`.

## Rollback

1. Re-deploy the previous Cloudflare Worker version.
2. If the issue is auth-related, rotate `DASHBOARD_SESSION_SECRET`.
3. If the issue is data-exposure related, rotate `SUPABASE_SECRET_API_KEY`.
4. If the issue is config-related, restore the last known-good `config/profiles/production.json` values and redeploy.
