# Kōkua Hub

**Request Help. Offer Help. Coordinate Relief.**

A source-aware, trust-weighted community coordination tool for disaster relief in Hawaiʻi. Aggregates, annotates, prioritizes, and routes information from multiple sources — official, nonprofit, news, social, and community.

## Core Principle

Kōkua Hub is a **hub**, not the source of truth for every spoke. We aggregate, annotate, prioritize, and route. We do not try to fully own every upstream dataset.

## Stack

- **Next.js 14** (App Router, Server Actions)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, Row Level Security)
- **TypeScript**

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> && cd kokua && npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. (Optional) Run `supabase/seed.sql` for test data

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`

### 4. Run

```bash
npm run dev
```

## Architecture

### Public Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/need-help` | "I Need Help" landing |
| `/need-help/find` | Curated resources with source provenance |
| `/need-help/request` | Private help request |
| `/can-help` | "I Can Help" landing with current needs |
| `/can-help/offer` | Offer supplies/services |
| `/can-help/volunteer` | Volunteer signup |
| `/can-help/share-info` | Community resource tip → review queue |
| `/feedback` | Public feedback/questions/corrections |
| `/about` | About & Safety |

### Redirect Routes

| `/help` → `/need-help` | `/give` → `/can-help` | `/request` → `/need-help/request` | `/offer` → `/can-help/offer` |

### Protected Routes

| `/dashboard` | Coordination Board | `/dashboard/login` | Login |

## Source System

### Source Registry

Configured upstream sources with trust metadata:

| Field | Purpose |
|---|---|
| `source_type` | official, nonprofit, news, social, community, internal, other |
| `platform` | facebook, x, instagram, website, email, word_of_mouth, github, other |
| `trust_level` | high, medium, low |
| `update_frequency` | realtime, hourly, daily, weekly, ad_hoc, unknown |
| `strategy` | monitor, mirror, redirect |

### Source Signals

Individual observations from sources. Each signal has:
- Source provenance (linked to registry)
- Signal type (resource, need, update, closure, etc.)
- Location (island, area, neighborhood)
- Derived resource info (name, type, status)
- Confidence level (high, medium, low)
- Review status (pending, approved, rejected, escalated)
- Optional raw payload and URL

### Trust Rules

1. Social media signals always require review (`needs_review = true`)
2. Low-confidence signals never auto-publish
3. Missing source → stays internal/review
4. High-trust official sources publish faster but preserve provenance
5. Public pages never expose raw signal payloads, raw social text, or private contacts

## Data Privacy Model

| Data | Visibility | Access |
|---|---|---|
| Help requests | Coordinators only | service_role |
| Help offers | Coordinators only | service_role |
| Volunteers | Coordinators only | service_role |
| Source signals | Coordinators only | service_role |
| Source registry | Admin only | service_role |
| Help hubs (`visibility_status='public'`) | **Public** | anon select |
| Need summaries (`visibility_status='public'`) | **Public** | anon select |
| Review queue | Coordinators only | service_role |
| Coordinator notes | Never public | service_role |

### Visibility States

| State | Meaning |
|---|---|
| `public` | Shown on public pages |
| `internal` | Visible to coordinators only |
| `review` | Awaiting coordinator review before any visibility |

## Roles & Permissions

| | Coordinator | Admin |
|---|---|---|
| View all data | Yes | Yes |
| Update statuses & notes | Yes | Yes |
| Manage hub/summary visibility | Yes | Yes |
| Triage review queue | Yes | Yes |
| Review source signals | Yes | Yes |
| Manage source registry | No | Yes |
| Manage dashboard users | No | Yes |
| Import settings | No | Yes |

## Dashboard Tabs

1. **Requests** — Private help requests
2. **Offers** — Private help offers
3. **Volunteers** — Volunteer signups
4. **Hubs** — Curated resources with source provenance, confidence, visibility
5. **Needs** — Coordinator-authored summaries with source provenance
6. **Review** — Community tips, feedback, source-derived items
7. **Signals** — Source observations with review workflow
8. **Sources** — Source registry (admin only)

## Import Scripts

```bash
# Import source registry entries
npx tsx scripts/import-sources.ts scripts/sample-sources.json

# Import source signals (applies trust rules automatically)
npx tsx scripts/import-signals.ts scripts/sample-signals.json

# Import help hubs (defaults to visibility_status='review')
npx tsx scripts/import-hubs.ts scripts/sample-hubs.json
```

## Feedback System

Public feedback form at `/feedback` supports:
- Question, feedback, report incorrect info, suggest resource, bug, feature request, other
- No login required, optional contact info
- Routes into review queue for coordinator triage

### GitHub Issue Bridge (Design)

Safe categories (`bug`, `feature_request`, `suggest_resource`) may be bridged to GitHub issues:

```
review_queue_items.feedback_category IN ('bug', 'feature_request', 'suggest_resource')
  → Coordinator approves
  → Create GitHub issue (title + sanitized message, no personal data)
  → Store github_issue_url and github_issue_number on review_queue_item
```

**Sensitive categories** (`question`, `feedback`, `report_issue`, `other`) stay internal only — never sent to GitHub. Personal contact info is never included in GitHub issues.

Implementation: Add a server action that calls the GitHub API via `GITHUB_TOKEN` env var when a coordinator clicks "Create Issue" on an approved review item. Not yet implemented — designed for v2 when GitHub integration is configured.

## QR Code Strategy

| Target | URL |
|---|---|
| Main page | `/` |
| Need Help | `/help` |
| Can Help | `/give` |
| Find Resources | `/need-help/find` |
| Share a Tip | `/can-help/share-info` |
| Feedback | `/feedback` |

## What to Postpone

- Map view
- Automated source scraping/polling
- GitHub issue bridge implementation
- SMS/email notifications
- Multi-language support
- Photo uploads
- Real-time WebSocket updates
- Automated matching
- Audit logging
- Rate limiting / CAPTCHA

## License

MIT
