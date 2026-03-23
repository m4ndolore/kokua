# Kōkua Hub

**Request Help. Offer Help. Coordinate Relief.**

A simple, mobile-first community coordination tool for disaster relief in Hawaiʻi. Built to connect people who need help with people who can offer help, coordinated by volunteers.

## Stack

- **Next.js 14** (App Router, Server Actions)
- **Tailwind CSS** (utility-first styling)
- **Supabase** (PostgreSQL database, Row Level Security)
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
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. (Optional) Run `supabase/seed.sql` to add test data

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (used server-side only for dashboard)
- `DASHBOARD_PASSWORD` — Password for volunteer/admin dashboard access

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Cloudflare Pages

```bash
npm run build
```

Deploy the `.next` output via Cloudflare Pages:

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add all environment variables from `.env.local` to the Cloudflare Pages settings
5. Deploy

Alternatively, use Vercel or any Node.js hosting platform.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with primary actions |
| `/request` | Request Help form |
| `/offer` | Offer Help form |
| `/help` | Short redirect → `/request` (QR-friendly) |
| `/give` | Short redirect → `/offer` (QR-friendly) |
| `/about` | About & Safety information |
| `/dashboard` | Volunteer/Admin dashboard (password protected) |
| `/dashboard/login` | Dashboard login |

## QR Code Strategy

Generate QR codes pointing to these URLs for physical distribution:

| QR Target | URL | Use Case |
|---|---|---|
| Main page | `https://yourdomain.com/` | General flyers, community boards |
| Request Help | `https://yourdomain.com/help` | Shelters, affected areas (short URL) |
| Offer Help | `https://yourdomain.com/give` | Supply drop-off points, volunteer centers (short URL) |
| Full request form | `https://yourdomain.com/request` | Direct link |
| Full offer form | `https://yourdomain.com/offer` | Direct link |

Short routes (`/help`, `/give`) are easier to print on flyers and remember. QR codes can be generated with any free QR code tool. Print on weather-resistant material for field distribution.

## Database Schema

Two tables with Row Level Security:

- **help_requests** — Public insert, service-role read/update
- **help_offers** — Public insert, service-role read/update

See `supabase/schema.sql` for full schema.

## What to Postpone Until v2

- Map view of requests/offers
- Automated matching logic
- User accounts / login for public users
- SMS notifications
- Multi-language support (Hawaiian, Tagalog, Japanese, etc.)
- Photo/image uploads
- Real-time updates on dashboard
- Export/reporting features
- Volunteer shift scheduling
- Supply inventory tracking
- Integration with official emergency services
- Audit log for status changes
- Rate limiting / CAPTCHA
- Email confirmations to submitters

## License

MIT
