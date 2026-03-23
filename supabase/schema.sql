-- Kōkua Hub — Supabase Schema v3 (Source-Aware)
-- Run this in the Supabase SQL Editor to set up your database.
-- If upgrading from v2, back up data first, then run this fresh.

-- ============================================================
-- ROLES & AUTH
-- ============================================================

create table if not exists dashboard_users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  email text unique not null,
  name text not null,
  role text not null check (role in ('coordinator', 'admin')),
  is_active boolean default true not null
);

-- ============================================================
-- SOURCE SYSTEM
-- ============================================================

-- Source Registry: configured upstream sources we may monitor, scrape, or review
create table if not exists source_registry (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  source_type text not null check (source_type in (
    'official', 'nonprofit', 'news', 'social', 'community', 'internal', 'other'
  )),
  platform text check (platform is null or platform in (
    'facebook', 'x', 'instagram', 'website', 'email', 'word_of_mouth', 'github', 'other'
  )),
  base_url text,
  organization text,
  trust_level text not null default 'medium' check (trust_level in ('high', 'medium', 'low')),
  update_frequency text not null default 'unknown' check (update_frequency in (
    'realtime', 'hourly', 'daily', 'weekly', 'ad_hoc', 'unknown'
  )),
  strategy text not null default 'monitor' check (strategy in ('monitor', 'mirror', 'redirect')),
  is_active boolean not null default true,
  notes text,
  last_checked_at timestamptz
);

-- Source Signals: individual observations/items from sources
create table if not exists source_signals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  source_registry_id uuid references source_registry(id),
  title text,
  signal_type text not null check (signal_type in (
    'resource', 'need', 'update', 'closure', 'route_change',
    'donation_drive', 'volunteer_call', 'question', 'feedback', 'other'
  )),
  raw_url text,
  raw_text text,
  raw_payload jsonb,
  island text,
  area text,
  neighborhood text,
  derived_resource_name text,
  derived_resource_type text,
  derived_status text check (derived_status is null or derived_status in (
    'active', 'limited', 'planned', 'inactive', 'unknown'
  )),
  confidence text not null default 'low' check (confidence in ('high', 'medium', 'low')),
  freshness_score integer,
  last_observed_at timestamptz,
  needs_review boolean not null default true,
  review_reason text,
  review_status text not null default 'pending' check (review_status in (
    'pending', 'approved', 'rejected', 'escalated'
  )),
  reviewed_by uuid references dashboard_users(id),
  reviewed_at timestamptz,
  linked_help_hub_id uuid references help_hubs(id),
  linked_need_summary_id uuid references public_need_summaries(id),
  coordinator_notes text
);

-- ============================================================
-- CORE TABLES (private coordination data)
-- ============================================================

create table if not exists help_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  island text not null,
  neighborhood text not null,
  need_types text[] not null,
  urgency text not null check (urgency in ('Urgent', 'Soon', 'Flexible')),
  contact_method text not null check (contact_method in ('Phone', 'Email')),
  contact_value text not null,
  alt_contact text,
  note text,
  can_be_contacted boolean default false,
  status text default 'New' not null check (status in ('New', 'Reviewing', 'Matched', 'Completed', 'Archived')),
  coordinator_notes text
);

create table if not exists help_offers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  island text not null,
  neighborhood text not null,
  offer_types text[] not null,
  availability text not null check (availability in ('Today', 'Next 24 hours', 'This week')),
  contact_method text not null check (contact_method in ('Phone', 'Email')),
  contact_value text not null,
  note text,
  capacity text,
  status text default 'New' not null check (status in ('New', 'Available', 'Assigned', 'Completed', 'Archived')),
  coordinator_notes text
);

create table if not exists volunteers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null,
  island text not null,
  neighborhood text,
  skills text[] not null,
  availability text not null check (availability in ('Today', 'Next 24 hours', 'This week', 'Ongoing')),
  contact_method text not null check (contact_method in ('Phone', 'Email')),
  contact_value text not null,
  languages text,
  has_vehicle boolean default false,
  note text,
  status text default 'New' not null check (status in ('New', 'Active', 'On hold', 'Inactive')),
  coordinator_notes text
);

-- ============================================================
-- DONATIONS MODULE
-- ============================================================

create table if not exists donation_links (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  external_id text unique not null,
  title text not null,
  organization text,
  donation_type text not null check (donation_type in (
    'institutional', 'community_campaign', 'in_kind_support', 'platform_hub', 'volunteer'
  )),
  description text,
  island text,
  area text,
  neighborhood text,
  address text,
  hours text,
  destination_url text not null,
  source_name text,
  source_type text,
  source_url text,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  trust_score smallint check (trust_score is null or trust_score between 0 and 100),
  badges text[] not null default '{}',
  flags text[] not null default '{}',
  last_verified_at timestamptz,
  is_visible boolean not null default false,
  needs_review boolean not null default true,
  review_reason text,
  tags text[] not null default '{}'
);

-- ============================================================
-- PUBLIC-FACING CURATED TABLES (source-aware)
-- ============================================================

-- Help Hubs with source provenance
create table if not exists help_hubs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  island text not null,
  area text not null,
  category text not null check (category in (
    'Shelter', 'Food distribution', 'Water distribution',
    'Supply distribution', 'Medical', 'Charging station',
    'Laundry', 'Shower', 'Cleanup staging', 'Government office',
    'Volunteer hub', 'Donation drop-off', 'Other'
  )),
  status text default 'Open' not null check (status in ('Open', 'Limited', 'Closed', 'Unknown')),
  hours text,
  notes text,
  public_phone text,
  public_email text,
  address text,
  -- Source provenance
  source_name text,
  source_type text check (source_type is null or source_type in (
    'official', 'nonprofit', 'news', 'social', 'community', 'internal', 'other'
  )),
  source_url text,
  source_registry_id uuid references source_registry(id),
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  last_verified_at timestamptz,
  -- Visibility and trust
  visibility_status text not null default 'review' check (visibility_status in ('public', 'internal', 'review')),
  verification_count integer not null default 0,
  stale_flag_count integer not null default 0,
  active_confirm_count integer not null default 0,
  coordinator_notes text
);

-- Public Need Summaries with source provenance
create table if not exists public_need_summaries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  island text not null,
  area text,
  title text not null,
  description text not null,
  category text not null check (category in (
    'Volunteers needed', 'Supplies needed', 'Transportation needed',
    'Donations needed', 'Skilled help needed', 'General'
  )),
  urgency text not null check (urgency in ('Urgent', 'High', 'Normal')),
  -- Source provenance
  source_name text,
  source_type text check (source_type is null or source_type in (
    'official', 'nonprofit', 'news', 'social', 'community', 'internal', 'other'
  )),
  source_url text,
  source_registry_id uuid references source_registry(id),
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  last_verified_at timestamptz,
  -- Visibility
  visibility_status text not null default 'review' check (visibility_status in ('public', 'internal', 'review')),
  coordinator_notes text
);

-- Review Queue — expanded for source signals, community tips, feedback
create table if not exists review_queue_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  -- Origin: community_tip | source_signal | stale_flag | feedback | conflict | other
  origin text not null default 'community_tip' check (origin in (
    'community_tip', 'source_signal', 'stale_flag', 'feedback', 'conflict', 'other'
  )),
  -- Community tip fields
  submitted_name text,
  submitted_island text,
  submitted_area text,
  submitted_info text,
  submitted_category text,
  submitted_contact text,
  -- Feedback fields
  feedback_category text check (feedback_category is null or feedback_category in (
    'question', 'feedback', 'report_issue', 'suggest_resource', 'bug', 'feature_request', 'other'
  )),
  feedback_message text,
  feedback_contact text,
  feedback_page_url text,
  -- Source signal link
  source_signal_id uuid references source_signals(id),
  source_registry_id uuid references source_registry(id),
  -- Review workflow
  status text default 'Pending' not null check (status in ('Pending', 'Approved', 'Rejected', 'Duplicate', 'Escalated')),
  reviewer_notes text,
  reviewed_by uuid references dashboard_users(id),
  reviewed_at timestamptz,
  promoted_hub_id uuid references help_hubs(id),
  promoted_summary_id uuid references public_need_summaries(id),
  -- GitHub issue bridge
  github_issue_url text,
  github_issue_number integer
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Source system
create index if not exists idx_source_registry_active on source_registry(is_active) where is_active = true;
create index if not exists idx_source_registry_type on source_registry(source_type);

create index if not exists idx_signals_source on source_signals(source_registry_id);
create index if not exists idx_signals_review on source_signals(review_status) where review_status = 'pending';
create index if not exists idx_signals_needs_review on source_signals(needs_review) where needs_review = true;
create index if not exists idx_signals_type on source_signals(signal_type);
create index if not exists idx_signals_island on source_signals(island);
create index if not exists idx_signals_created on source_signals(created_at desc);
create index if not exists idx_signals_linked_hub on source_signals(linked_help_hub_id);

-- Core tables
create index if not exists idx_requests_status on help_requests(status);
create index if not exists idx_requests_island on help_requests(island);
create index if not exists idx_requests_urgency on help_requests(urgency);
create index if not exists idx_requests_created on help_requests(created_at desc);

create index if not exists idx_offers_status on help_offers(status);
create index if not exists idx_offers_island on help_offers(island);
create index if not exists idx_offers_created on help_offers(created_at desc);

create index if not exists idx_volunteers_status on volunteers(status);
create index if not exists idx_volunteers_island on volunteers(island);

-- Donations
create index if not exists idx_donation_links_island on donation_links(island);
create index if not exists idx_donation_links_donation_type on donation_links(donation_type);
create index if not exists idx_donation_links_confidence on donation_links(confidence);
create index if not exists idx_donation_links_is_visible on donation_links(is_visible) where is_visible = true;
create index if not exists idx_donation_links_needs_review on donation_links(needs_review) where needs_review = true;
create index if not exists idx_donation_links_tags on donation_links using gin(tags);

-- Public-facing
create index if not exists idx_hubs_visibility on help_hubs(visibility_status) where visibility_status = 'public';
create index if not exists idx_hubs_island on help_hubs(island);
create index if not exists idx_hubs_category on help_hubs(category);
create index if not exists idx_hubs_confidence on help_hubs(confidence);
create index if not exists idx_hubs_source_registry on help_hubs(source_registry_id);

create index if not exists idx_summaries_visibility on public_need_summaries(visibility_status) where visibility_status = 'public';
create index if not exists idx_summaries_island on public_need_summaries(island);

create index if not exists idx_review_status on review_queue_items(status);
create index if not exists idx_review_origin on review_queue_items(origin);
create index if not exists idx_review_feedback_cat on review_queue_items(feedback_category);

create index if not exists idx_dashboard_users_email on dashboard_users(email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table dashboard_users enable row level security;
alter table source_registry enable row level security;
alter table source_signals enable row level security;
alter table help_requests enable row level security;
alter table help_offers enable row level security;
alter table volunteers enable row level security;
alter table donation_links enable row level security;
alter table help_hubs enable row level security;
alter table public_need_summaries enable row level security;
alter table review_queue_items enable row level security;

-- Public inserts (form submissions)
create policy "Anyone can submit a help request"
  on help_requests for insert with check (true);
create policy "Anyone can submit a help offer"
  on help_offers for insert with check (true);
create policy "Anyone can submit a volunteer signup"
  on volunteers for insert with check (true);
create policy "Anyone can submit a review queue item"
  on review_queue_items for insert with check (true);

-- Public reads (only curated, public-visibility content)
create policy "Public can read public help hubs"
  on help_hubs for select
  using (visibility_status = 'public');
create policy "Public can read public need summaries"
  on public_need_summaries for select
  using (visibility_status = 'public');
create policy "Public can read visible donation links"
  on donation_links for select
  using (is_visible = true);

-- Service role full access (dashboard backend)
create policy "Service role full access to dashboard_users"
  on dashboard_users for all using (auth.role() = 'service_role');
create policy "Service role full access to source_registry"
  on source_registry for all using (auth.role() = 'service_role');
create policy "Service role full access to source_signals"
  on source_signals for all using (auth.role() = 'service_role');
create policy "Service role full access to help_requests"
  on help_requests for all using (auth.role() = 'service_role');
create policy "Service role full access to help_offers"
  on help_offers for all using (auth.role() = 'service_role');
create policy "Service role full access to volunteers"
  on volunteers for all using (auth.role() = 'service_role');
create policy "Service role full access to donation_links"
  on donation_links for all using (auth.role() = 'service_role');
create policy "Service role full access to help_hubs"
  on help_hubs for all using (auth.role() = 'service_role');
create policy "Service role full access to public_need_summaries"
  on public_need_summaries for all using (auth.role() = 'service_role');
create policy "Service role full access to review_queue_items"
  on review_queue_items for all using (auth.role() = 'service_role');
