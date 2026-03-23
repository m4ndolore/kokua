# Kōkua Hub

**Request Help. Offer Help. Coordinate Relief.**

A mobile-first community coordination tool for disaster relief in Hawaiʻi. Connects people who need help with verified resources and volunteer coordinators.

## Stack

- **Next.js 14** (App Router, Server Actions)
- **Tailwind CSS v4** (utility-first styling)
- **Supabase** (PostgreSQL, Row Level Security)
- **TypeScript**

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd kokua
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. (Optional) Run `supabase/seed.sql` to add test data

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)
- `DASHBOARD_PASSWORD` — Shared password for dashboard access

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy

```bash
npm run build
```

Deploy to Cloudflare Pages, Vercel, or any Node.js host. Set all env vars in the hosting platform.

## Architecture

### Public Routes (no login required)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/need-help` | "I Need Help" landing |
| `/need-help/find` | Find Help Near You — curated public resources |
| `/need-help/request` | Submit a private help request |
| `/can-help` | "I Can Help" landing with current needs |
| `/can-help/offer` | Offer supplies or services |
| `/can-help/volunteer` | Volunteer signup |
| `/can-help/share-info` | Submit a community resource tip |
| `/about` | About & Safety |

### Redirect Routes (backward-compatible, QR-friendly)

| Route | Redirects to |
|---|---|
| `/help` | `/need-help` |
| `/give` | `/can-help` |
| `/request` | `/need-help/request` |
| `/offer` | `/can-help/offer` |

### Protected Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Coordination Board (password required) |
| `/dashboard/login` | Dashboard login |

## Roles

| Role | Can do |
|---|---|
| **Coordinator** | View all data, update statuses, manage notes, toggle hub/summary visibility |
| **Admin** | Everything coordinator can do, plus manage dashboard users and system settings |

**Login methods:**
- Legacy: enter `DASHBOARD_PASSWORD` directly (logs in as admin)
- Role-based: enter `email:password` where password is `DASHBOARD_PASSWORD` and email matches a `dashboard_users` row

## Dashboard Tabs

1. **Requests** — Private help requests with urgency/status/island filters
2. **Offers** — Private help offers with status/availability info
3. **Volunteers** — Volunteer signups with skills, availability, vehicle info
4. **Help Hubs** — Curated public resource listings (shelters, distribution sites, etc.)
5. **Needs** — Coordinator-authored public need summaries
6. **Review** — Community-submitted resource tips awaiting moderation

## Data Privacy Model

| Data | Who can see it | Where it lives |
|---|---|---|
| Help requests | Coordinators only | `help_requests` table, service-role access |
| Help offers | Coordinators only | `help_offers` table, service-role access |
| Volunteers | Coordinators only | `volunteers` table, service-role access |
| Help hubs (visible) | **Public** | `help_hubs` where `is_visible=true`, anon access |
| Need summaries (visible) | **Public** | `public_need_summaries` where `is_visible=true`, anon access |
| Review queue | Coordinators only | `review_queue_items`, service-role access |
| Coordinator notes | Coordinators only | Never exposed to public UI |

## Importing Resources

To bulk-import help hubs from a trusted source:

```bash
# Install tsx if not available
npm install -D tsx

# Run import
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-key \
npx tsx scripts/import-hubs.ts scripts/sample-hubs.json
```

See `scripts/sample-hubs.json` for the expected format. Imported hubs default to `is_visible=false` — set them visible via the dashboard after review.

## QR Code Strategy

| QR Target | URL | Use Case |
|---|---|---|
| Main page | `https://yourdomain.com/` | General flyers |
| Need Help | `https://yourdomain.com/help` | Shelters, affected areas |
| Can Help | `https://yourdomain.com/give` | Volunteer/donation sites |
| Find Resources | `https://yourdomain.com/need-help/find` | Resource boards |
| Share a Tip | `https://yourdomain.com/can-help/share-info` | Community boards |

## What to Postpone Until v2

- Map view of hubs and resources
- Automated matching between requests and offers
- User accounts for public users
- SMS/email notifications
- Multi-language support (Hawaiian, Tagalog, Japanese, etc.)
- Photo uploads
- Real-time dashboard updates (WebSocket)
- Export/reporting
- Volunteer shift scheduling
- Supply inventory tracking
- Audit log for status changes
- Rate limiting / CAPTCHA
- Email confirmations to submitters

## License

MIT
