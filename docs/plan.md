## Tech Stack

* **Next.js 14** (App Router, Server Actions)
* **TypeScript** (strict mode, `@/*` → `./src/*`)
* **Tailwind CSS v4**
* **Supabase (PostgreSQL + RLS)**

---

## Architecture

### Public vs Private Data Split

**Public (client-safe via anon key):**

* `help_hubs` (is_visible = true)
* `public_need_summaries` (is_visible = true)
* `donation_links` (is_visible = true)

**Private (service role only):**

* `help_requests`
* `help_offers`
* `volunteers`
* `review_queue_items`
* `source_signals`
* `dashboard_users`
* internal notes and feedback

All writes go through Server Actions using the server-side Supabase secret key.

---

### Source-Aware System (Critical)

Every piece of data must include:

* `source_name`
* `source_type`
* `source_url`
* `confidence`
* `last_verified_at`

We track:

#### source_registry

Known upstream sources (FB pages, org sites, etc.)

#### source_signals

Raw observations from those sources

#### help_hubs / need_summaries

Curated outputs derived from signals

Flow:

```
Source → Signal → Review → Public Object
```

Never skip this flow.

---

### Auth Model

No Supabase Auth.

* Cookie-based auth (`kokua_dash_auth`)
* Password stored in env
* Roles:

  * `coordinator`
  * `admin`

Auth logic: `src/lib/auth.ts`

---

## Routing

### Public

* `/` — decision screen
* `/need-help/*`
* `/can-help/*`
* `/help`, `/give` (QR redirects)

* `/donate`

### Private

* `/dashboard`
* `/dashboard/login`

---

## Data Flow Patterns

### Form Submission

1. Client submits form
2. Server Action validates
3. Insert via service role
4. Return `FormState`
5. Client shows confirmation

---

### Source Ingestion (Important)

External agents provide JSON → stored as `source_signals`

Rules:

* never auto-publish low-confidence data
* social sources default to `needs_review=true`
* preserve provenance at all times

---

### Review Queue

All uncertain data goes here:

* community submissions
* social signals
* flagged items
* feedback reports

Coordinators can:

* approve → create/update public object
* reject
* escalate

---

## Donations Module

Purpose:

* surface donation opportunities
* provide trust context
* redirect users externally

Constraints:

* no payment processing
* no endorsement
* review-first
* outbound links only

Status:

* spec exists in `docs/kokua_hub_donations_module_v_1_spec.md`
* not yet implemented in the current app or schema

---

## Feedback System

Public users can submit:

* questions
* feedback
* report incorrect info
* suggestions

Routing:

* stored internally
* optionally sent to GitHub issues (safe categories only)

Never send:

* personal requests
* sensitive data

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_API_KEY
DASHBOARD_PASSWORD
```

Never expose the server-side Supabase secret key client-side.

---

## Database

Defined in:

```
supabase/schema.sql
```

Includes:

* RLS policies
* indexes
* public/private separation

---

## Key Files

| File                           | Purpose             |
| ------------------------------ | ------------------- |
| `src/lib/types.ts`             | constants + types   |
| `src/lib/supabase.ts`          | Supabase clients    |
| `src/lib/auth.ts`              | dashboard auth      |
| `src/lib/actions.ts`           | public submissions  |
| `src/lib/dashboard-actions.ts` | coordinator actions |
| `scripts/import-hubs.ts`       | bulk import         |
| `data-raw/`                    | ingestion staging   |

---

## Implementation Guidelines

### When adding features:

Ask:

1. Is this public or private?
2. Does this require a source?
3. Does this require review?
4. Can this be simpler?

### Avoid:

* adding user accounts (v1)
* exposing raw requests publicly
* auto-publishing scraped data
* complex matching logic
* real-time sync systems

---

## Mental Model for Contributors

Think of Kōkua Hub as:

* a **coordination board**, not a marketplace
* a **signal processor**, not a database of record
* a **trusted lens**, not a firehose

---

## If You’re Unsure

Default to:

* less data
* more review
* clearer provenance
* simpler UX

```

---

# 🔥 What Improved (Why This Matters)

### 1. Adds system-level clarity
Before: “what the app does”  
Now: **how the system behaves**

### 2. Prevents agent drift
Without this, agents will:
- overbuild automation
- expose too much data
- treat it like a marketplace

### 3. Encodes your philosophy
The “hub not spokes” concept is now **enforceable**

### 4. Aligns all modules
- core app
- ingestion
- donations
- feedback
- dashboard

---

# 🎯 Final Suggestion

Make this file **required reading** for:
- Claude
- Codex
- any future agents

And add one rule to your repo:

> Any PR that changes schema, routing, or public data must update CLAUDE.md if it affects system behavior.
