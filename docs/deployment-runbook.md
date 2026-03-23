# Deployment Runbook

## Prerequisites

- Supabase project created with a production database
- Cloudflare account with Workers enabled
- `wrangler` CLI authenticated (`npx wrangler login`)
- Node.js 18+ and npm installed

## 1. Database Setup

### Apply schema

Run `supabase/schema.sql` in the Supabase SQL Editor for your production project. This creates all 10 tables, indexes, and RLS policies.

### Verify tables exist

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: `dashboard_users`, `donation_links`, `help_hubs`, `help_offers`, `help_requests`, `public_need_summaries`, `review_queue_items`, `source_registry`, `source_signals`, `volunteers`

### Create initial admin user

```sql
INSERT INTO dashboard_users (email, name, role)
VALUES ('your-admin@example.com', 'Admin', 'admin');
```

## 2. Fill Production Config

Edit `config/profiles/production.json` with your Supabase project values:

```json
{
  "worker": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://<project-id>.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "<anon-key-from-supabase-settings>"
  }
}
```

Both values are from Supabase Dashboard > Settings > API.

## 3. Set Cloudflare Worker Secrets

```bash
echo '<supabase-secret-api-key>' | npx wrangler secret put SUPABASE_SECRET_API_KEY
echo '<strong-password>'  | npx wrangler secret put DASHBOARD_PASSWORD
echo '<random-32-chars>'  | npx wrangler secret put DASHBOARD_SESSION_SECRET
```

Generate `DASHBOARD_SESSION_SECRET` with:

```bash
openssl rand -base64 32
```

Use the Supabase secret server-side API key you intend to trust at the Worker boundary.

## 4. Validate Configuration

```bash
env \
  SUPABASE_SECRET_API_KEY='<value>' \
  DASHBOARD_PASSWORD='<value>' \
  DASHBOARD_SESSION_SECRET='<value>' \
  npm run doctor:production
```

Must print: `doctor: production configuration is valid`

## 5. Build

```bash
env \
  SUPABASE_SECRET_API_KEY='<value>' \
  DASHBOARD_PASSWORD='<value>' \
  DASHBOARD_SESSION_SECRET='<value>' \
  npm run cf:build
```

## 6. Preview (Optional)

```bash
npm run cf:preview
```

Requires `.dev.vars` with the three secrets for local Wrangler.

## 7. Deploy

```bash
env \
  SUPABASE_SECRET_API_KEY='<value>' \
  DASHBOARD_PASSWORD='<value>' \
  DASHBOARD_SESSION_SECRET='<value>' \
  npm run cf:deploy
```

## 8. Smoke Tests

After deploy, verify each in a browser:

| Check | URL | Expected |
|-------|-----|----------|
| Landing page | `/` | Two CTA buttons render |
| Find help | `/need-help/find` | Hub cards load (or empty state) |
| Submit request | `/need-help/request` | Form submits, shows confirmation |
| Submit offer | `/can-help/offer` | Form submits, shows confirmation |
| Feedback form | `/feedback` | Form submits, shows confirmation |
| Dashboard login | `/dashboard/login` | Password prompt renders |
| Dashboard auth | `/dashboard` | Redirects to login if not authed |
| Dashboard access | Login with `email:password` | Board loads with tabs |
| Logout | Click "Sign out" | Redirected to login, cookie cleared |
| QR redirects | `/help` | Redirects to `/need-help` |

## 9. Seed Data (Optional)

Import the supported legacy raw exports directly:

```bash
SUPABASE_SECRET_API_KEY='<value>' \
NEXT_PUBLIC_SUPABASE_URL='https://<project>.supabase.co' \
node scripts/import-data-raw.mjs \
  data-raw/relief_seed.json \
  data-raw/kokua_seed_batch2.json \
  data-raw/kokua_donations_seed.json
```

Notes:

- The importer currently supports `source_registry`, `source_signals`, `help_hubs`, `public_need_summaries`, and `donation_links`.
- Legacy `review_queue` blocks are also skipped because their shape does not match the current `review_queue_items` schema.

## Rollback

### Revert Worker deployment

```bash
npx wrangler rollback
```

### Revert database changes

If the schema was applied to an existing database, restore from the most recent Supabase backup (Dashboard > Database > Backups).

For new projects, drop and re-run schema:

```sql
-- WARNING: destroys all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- then re-run supabase/schema.sql
```

## Secret Rotation

### Rotate DASHBOARD_PASSWORD

1. Set new secret: `echo '<new>' | npx wrangler secret put DASHBOARD_PASSWORD`
2. Redeploy: `npm run cf:deploy`
3. All existing sessions continue until their 24h expiry (tokens are signed with `DASHBOARD_SESSION_SECRET`, not the password)

### Rotate DASHBOARD_SESSION_SECRET

1. Set new secret: `echo '<new>' | npx wrangler secret put DASHBOARD_SESSION_SECRET`
2. Redeploy: `npm run cf:deploy`
3. All existing sessions are immediately invalidated (tokens can no longer be verified)

### Rotate SUPABASE_SECRET_API_KEY

1. Regenerate or replace the server-side Supabase key you use for the Worker
2. Set new secret: `echo '<new>' | npx wrangler secret put SUPABASE_SECRET_API_KEY`
3. Redeploy: `npm run cf:deploy`
