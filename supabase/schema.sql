-- Kōkua Hub — Supabase Schema v2
-- Run this in the Supabase SQL Editor to set up your database.
-- If upgrading from v1, back up data first, then run this fresh.

-- ============================================================
-- ROLES & AUTH
-- ============================================================

-- Dashboard users with role-based access
create table if not exists dashboard_users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  email text unique not null,
  name text not null,
  role text not null check (role in ('coordinator', 'admin')),
  is_active boolean default true not null
);

-- ============================================================
-- CORE TABLES (private coordination data)
-- ============================================================

-- Help Requests (private — never shown publicly)
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

-- Help Offers (private coordination data)
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

-- Volunteers (private — people who signed up to help coordinate)
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
-- PUBLIC-FACING CURATED TABLES
-- ============================================================

-- Help Hubs — curated public resource listings (shelters, distribution sites, etc.)
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
  last_verified_at timestamptz,
  source_url text,
  is_visible boolean default false not null,
  coordinator_notes text
);

-- Public Need Summaries — coordinator-authored public descriptions of current needs
-- These are NOT raw user requests. They are curated, anonymized summaries.
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
  is_visible boolean default false not null,
  coordinator_notes text
);

-- Review Queue — community-submitted tips ("Something I know")
-- These go through moderation before becoming help_hubs entries.
create table if not exists review_queue_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  submitted_name text,
  submitted_island text not null,
  submitted_area text,
  submitted_info text not null,
  submitted_category text,
  submitted_contact text,
  status text default 'Pending' not null check (status in ('Pending', 'Approved', 'Rejected', 'Duplicate')),
  reviewer_notes text,
  promoted_hub_id uuid references help_hubs(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_requests_status on help_requests(status);
create index if not exists idx_requests_island on help_requests(island);
create index if not exists idx_requests_urgency on help_requests(urgency);
create index if not exists idx_requests_created on help_requests(created_at desc);

create index if not exists idx_offers_status on help_offers(status);
create index if not exists idx_offers_island on help_offers(island);
create index if not exists idx_offers_created on help_offers(created_at desc);

create index if not exists idx_volunteers_status on volunteers(status);
create index if not exists idx_volunteers_island on volunteers(island);

create index if not exists idx_hubs_visible on help_hubs(is_visible) where is_visible = true;
create index if not exists idx_hubs_island on help_hubs(island);
create index if not exists idx_hubs_category on help_hubs(category);

create index if not exists idx_summaries_visible on public_need_summaries(is_visible) where is_visible = true;
create index if not exists idx_summaries_island on public_need_summaries(island);

create index if not exists idx_review_status on review_queue_items(status);

create index if not exists idx_dashboard_users_email on dashboard_users(email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table dashboard_users enable row level security;
alter table help_requests enable row level security;
alter table help_offers enable row level security;
alter table volunteers enable row level security;
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

-- Public reads (only curated, visible content)
create policy "Public can read visible help hubs"
  on help_hubs for select
  using (is_visible = true);

create policy "Public can read visible need summaries"
  on public_need_summaries for select
  using (is_visible = true);

-- Service role full access (dashboard backend)
create policy "Service role full access to requests"
  on help_requests for all using (auth.role() = 'service_role');

create policy "Service role full access to offers"
  on help_offers for all using (auth.role() = 'service_role');

create policy "Service role full access to volunteers"
  on volunteers for all using (auth.role() = 'service_role');

create policy "Service role full access to hubs"
  on help_hubs for all using (auth.role() = 'service_role');

create policy "Service role full access to summaries"
  on public_need_summaries for all using (auth.role() = 'service_role');

create policy "Service role full access to review queue"
  on review_queue_items for all using (auth.role() = 'service_role');

create policy "Service role full access to dashboard users"
  on dashboard_users for all using (auth.role() = 'service_role');
