# Kōkua Hub — Donations & Support v1

## Product position
Kōkua Hub surfaces donation options for Hawaiʻi flood relief, but does **not** process money, host campaigns, adjudicate legitimacy in real time, or become responsible for every campaign.

Core rule: **outbound only, review first, provenance visible**.

---

## 1) Schema update

### `donation_links`
```sql
create table if not exists donation_links (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  title text not null,
  organization text null,
  donation_type text not null check (donation_type in ('institutional', 'platform_hub', 'community_campaign', 'in_kind_support')),
  description text null,
  island text null,
  area text null,
  destination_url text not null,
  source_name text not null,
  source_type text not null check (source_type in ('official', 'nonprofit', 'news', 'social', 'community', 'platform', 'other')),
  source_url text not null,
  source_registry_id uuid null,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  trust_score integer not null default 50 check (trust_score >= 0 and trust_score <= 100),
  badges jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  last_verified_at timestamptz null,
  is_visible boolean not null default false,
  needs_review boolean not null default true,
  review_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donation_links_public_sort
  on donation_links (is_visible, trust_score desc, confidence, last_verified_at desc);

create index if not exists idx_donation_links_review
  on donation_links (needs_review, is_visible, source_type, confidence);
```

### `donation_feedback_signals`
```sql
create table if not exists donation_feedback_signals (
  id uuid primary key default gen_random_uuid(),
  donation_link_id uuid not null references donation_links(id) on delete cascade,
  signal_type text not null check (signal_type in ('donated_successfully', 'suspicious', 'broken', 'known_local_org')),
  created_at timestamptz not null default now()
);

create index if not exists idx_donation_feedback_signals_link
  on donation_feedback_signals (donation_link_id, signal_type, created_at desc);
```

### Guardrails
```sql
alter table donation_links
  add constraint donation_links_required_publication
  check (
    source_name <> '' and source_url <> '' and destination_url <> ''
  );
```

### Trigger for `updated_at`
```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

 drop trigger if exists trg_donation_links_updated_at on donation_links;
 create trigger trg_donation_links_updated_at
 before update on donation_links
 for each row execute function set_updated_at();
```

---

## 2) Route update

### Public routes
- `GET /donate`
- Embedded panel on:
  - `/need-help/find`
  - `/can-help`

### Internal routes
- `GET /admin/donations`
- `GET /admin/donations/:id`

### API endpoints
#### Public
- `GET /api/donations/public`
  - returns visible donation cards only
  - grouped by section
  - sorted by `trust_score desc`, `confidence desc`, `last_verified_at desc`
- `POST /api/donations/:id/signal`
  - payload: `{ signalType: 'donated_successfully' | 'suspicious' | 'broken' | 'known_local_org' }`
  - writes lightweight internal signal only

#### Internal
- `GET /api/admin/donations`
- `POST /api/admin/donations/import`
- `PATCH /api/admin/donations/:id`
- `POST /api/admin/donations/:id/approve`
- `POST /api/admin/donations/:id/hide`
- `POST /api/admin/donations/:id/mark-stale`
- `POST /api/admin/donations/:id/recompute-trust`

---

## 3) Dashboard tab

### Donations tab columns
- Title
- Organization
- Destination URL
- Source Name
- Source Type
- Confidence
- Trust Score
- Last Verified At
- Visibility
- Review Status
- Badges
- Flags

### Filters
- Needs review
- Visible
- Hidden
- Source type
- Donation type
- Confidence
- Flagged only
- Recently updated

### Actions
- Approve
- Hide
- Edit
- Mark stale
- Adjust badges
- View source link
- Open destination link

### Suggested row states
- **Ready to review**: hidden + needs review
- **Public**: visible + no review required
- **Flagged**: hidden or visible with one or more flags
- **Stale**: visible or hidden with `stale` flag

---

## 4) Public UI component plan

### `/donate` page structure

#### Header
**Title:** Donate & Support Flood Relief  
**Subtext:** We aggregate active relief efforts for awareness. We do not process donations or endorse specific campaigns.

#### Safety banner
**Text:** Scams increase during disasters. Verify before donating.

#### Sections
1. **Coordinated Relief Funds**
   - institutional
   - high-provenance nonprofit or official-linked items
2. **Verified Campaign Hubs**
   - platform_hub
   - public hub pages with clear source linkage
3. **Community Campaigns**
   - community_campaign
   - only after review and public approval

### Donation card fields
- Title
- Organization
- Short description
- Source name
- Last verified
- Badges
- External donate button

### Donation card footer
- `Source: [source_name]`
- `Last verified: [relative or absolute timestamp]`
- small external-link icon and label: `External site`

### Embedded panel behavior
For `/need-help/find` and `/can-help`, render:
- compact header
- top 2–4 visible items across categories
- link to `View all donation options` → `/donate`

### Calm UI rules
- no large urgency counters
- no flashing totals
- no prominent trust scores displayed as certainty
- show provenance and freshness plainly
- badges should be minimal chips, max 2–3 visible before `+N`

---

## 5) Import format

### JSON envelope
```json
{
  "source": {
    "name": "Civil Beat",
    "type": "news",
    "url": "https://example.org/flood-help"
  },
  "mode": "monitor",
  "items": [
    {
      "external_id": "civilbeat-2026-03-22-hcf-stronger-hawaii-fund",
      "title": "Stronger Hawaiʻi Fund",
      "organization": "Hawaiʻi Community Foundation",
      "donation_type": "institutional",
      "description": "Statewide disaster relief and resilience fund.",
      "island": "Oʻahu",
      "area": null,
      "destination_url": "https://example.org/donate",
      "source_name": "Civil Beat",
      "source_type": "news",
      "source_url": "https://example.org/flood-help",
      "confidence": "high",
      "last_verified_at": "2026-03-22T10:30:00Z",
      "badges": ["Established Organization"],
      "flags": []
    }
  ]
}
```

### Import rules
- imported items default to `needs_review = true`
- imported items default to `is_visible = false`
- exception: if `confidence = high` and `source_type in ('official', 'nonprofit', 'platform')` and `destination_url/source_url/source_name` exist, item may be auto-marked `needs_review = false` but should still be easy to audit
- any `source_type = social` always remains hidden until approved
- preserve source provenance exactly; do not rewrite or merge aggressively in v1

### Source classification
- `monitor`: source is an upstream feed to watch, not necessarily display directly
- `mirror`: source content may be normalized into records where clearly supported
- `redirect`: source is primarily a destination or hub users should be routed to

Rule: if the upstream source is a living feed, prefer `monitor` or `redirect` over `mirror`.

---

## 6) Seed examples

```json
[
  {
    "external_id": "hcf-stronger-hawaii-fund",
    "title": "Stronger Hawaiʻi Fund",
    "organization": "Hawaiʻi Community Foundation",
    "donation_type": "institutional",
    "description": "Statewide disaster preparedness, response, recovery, mitigation, and resilience support.",
    "island": "Statewide",
    "area": null,
    "destination_url": "https://www.hawaiicommunityfoundation.org/",
    "source_name": "Hawaiʻi Community Foundation",
    "source_type": "nonprofit",
    "source_url": "https://www.hawaiicommunityfoundation.org/",
    "confidence": "high",
    "trust_score": 88,
    "badges": ["Established Organization"],
    "flags": [],
    "last_verified_at": "2026-03-22T09:00:00Z",
    "is_visible": true,
    "needs_review": false,
    "review_reason": null
  },
  {
    "external_id": "gofundme-hawaii-flooding-hub",
    "title": "Hawaii Flooding Relief Hub",
    "organization": "GoFundMe",
    "donation_type": "platform_hub",
    "description": "Platform hub collecting public flood-related fundraisers.",
    "island": "Statewide",
    "area": null,
    "destination_url": "https://www.gofundme.com/communities/hawaii-flooding",
    "source_name": "GoFundMe",
    "source_type": "platform",
    "source_url": "https://www.gofundme.com/communities/hawaii-flooding",
    "confidence": "high",
    "trust_score": 78,
    "badges": ["Platform Verified"],
    "flags": [],
    "last_verified_at": "2026-03-22T09:15:00Z",
    "is_visible": true,
    "needs_review": false,
    "review_reason": null
  },
  {
    "external_id": "hawaiian-council-community-campaign-001",
    "title": "Support the North Shore Community",
    "organization": "Hawaiian Council",
    "donation_type": "community_campaign",
    "description": "Community-led emergency relief support for flood-affected areas.",
    "island": "Oʻahu",
    "area": "North Shore",
    "destination_url": "https://givebutter.com/example",
    "source_name": "Community post roundup",
    "source_type": "social",
    "source_url": "https://example.org/source-post",
    "confidence": "low",
    "trust_score": 42,
    "badges": ["Needs Review", "Limited Verification"],
    "flags": ["low_confidence"],
    "last_verified_at": null,
    "is_visible": false,
    "needs_review": true,
    "review_reason": "Social-derived campaign requires manual review before public display."
  }
]
```

---

## 7) Review workflow

### Intake
1. Register candidate source
2. Extract only clearly supported donation destinations
3. Preserve source metadata
4. Compute initial trust score
5. Apply review defaults

### Default review decisions
- `social` source → hidden + review required
- `low` confidence → hidden + review required
- missing `source_name`, `source_url`, or `destination_url` → reject from publication
- broken destination → flag and hide

### Reviewer actions
#### Approve
Sets:
- `is_visible = true`
- `needs_review = false`
- clears `Needs Review` badge if present

#### Hide
Sets:
- `is_visible = false`
- `needs_review = true` or false depending on reason

#### Mark stale
Adds `stale` flag and optionally lowers trust score

#### Adjust badges
Allowed badges only:
- Established Organization
- Platform Verified
- Local Organization
- Newly Added
- Limited Verification
- Needs Review

### Signal-triggered review
If negative signals accumulate, set:
- `needs_review = true`
- add appropriate flags
- optionally `is_visible = false` depending on threshold

Suggested thresholds:
- `broken >= 2` in 24h → add `broken_link`, hide
- `suspicious >= 2` in 24h → add `suspicious`, require review
- `broken + suspicious >= 3` in 48h → hide automatically

---

## 8) Minimal trust-score heuristic implementation

### Goal
A simple, explainable v1 score used for sorting and triage, not public certainty.

### Base score
- start at `50`

### Additions
- source_type = `official` → `+20`
- source_type = `nonprofit` → `+18`
- source_type = `platform` → `+12`
- donation_type = `institutional` → `+12`
- donation_type = `platform_hub` → `+8`
- `confidence = high` → `+12`
- `confidence = medium` → `+0`
- badge contains `Established Organization` → `+8`
- badge contains `Platform Verified` → `+6`
- badge contains `Local Organization` → `+4`
- `last_verified_at within 48 hours` → `+6`

### Deductions
- source_type = `social` → `-20`
- donation_type = `community_campaign` → `-6`
- `confidence = low` → `-18`
- flag `low_confidence` → `-10`
- flag `source_conflict` → `-15`
- flag `stale` → `-12`
- flag `broken_link` → `-30`
- flag `suspicious` → `-25`

### Clamp
- min `0`, max `100`

### Pseudocode
```ts
export function computeTrustScore(link: DonationLink): number {
  let score = 50;

  if (link.source_type === 'official') score += 20;
  if (link.source_type === 'nonprofit') score += 18;
  if (link.source_type === 'platform') score += 12;

  if (link.donation_type === 'institutional') score += 12;
  if (link.donation_type === 'platform_hub') score += 8;
  if (link.donation_type === 'community_campaign') score -= 6;

  if (link.confidence === 'high') score += 12;
  if (link.confidence === 'low') score -= 18;

  if (link.badges.includes('Established Organization')) score += 8;
  if (link.badges.includes('Platform Verified')) score += 6;
  if (link.badges.includes('Local Organization')) score += 4;

  if (link.source_type === 'social') score -= 20;

  if (link.flags.includes('low_confidence')) score -= 10;
  if (link.flags.includes('source_conflict')) score -= 15;
  if (link.flags.includes('stale')) score -= 12;
  if (link.flags.includes('broken_link')) score -= 30;
  if (link.flags.includes('suspicious')) score -= 25;

  if (link.last_verified_at) {
    const ageMs = Date.now() - new Date(link.last_verified_at).getTime();
    if (ageMs <= 48 * 60 * 60 * 1000) score += 6;
  }

  return Math.max(0, Math.min(100, score));
}
```

---

## Publication rules summary
- review first
- outbound only
- provenance always visible
- no payment handling
- no public campaign creation
- no public comments
- do not over-normalize early
- preserve source context

---

## Recommended implementation split

### Claude1 — site
- `/donate` page
- embedded Donations & Support panel
- card UI, safety banner, feedback buttons
- external-link treatment

### Claude2 — source ingestion
- register candidate sources
- parse clear donation destinations only
- preserve provenance and source mode (`monitor` / `mirror` / `redirect`)
- default uncertain items to review

### Claude3 — data transforms
- trust score computation
- section grouping
- public sorting
- negative-signal thresholds
- admin review states

