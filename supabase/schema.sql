-- Kōkua Hub — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.

-- Help Requests table
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

-- Help Offers table
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

-- Indexes for common queries
create index if not exists idx_requests_status on help_requests(status);
create index if not exists idx_requests_island on help_requests(island);
create index if not exists idx_requests_urgency on help_requests(urgency);
create index if not exists idx_requests_created on help_requests(created_at desc);

create index if not exists idx_offers_status on help_offers(status);
create index if not exists idx_offers_island on help_offers(island);
create index if not exists idx_offers_created on help_offers(created_at desc);

-- Row Level Security
alter table help_requests enable row level security;
alter table help_offers enable row level security;

-- Allow anonymous inserts (for public form submissions)
create policy "Anyone can submit a help request"
  on help_requests for insert
  with check (true);

create policy "Anyone can submit a help offer"
  on help_offers for insert
  with check (true);

-- Only service role can read/update (dashboard uses service role key server-side)
create policy "Service role can read requests"
  on help_requests for select
  using (auth.role() = 'service_role');

create policy "Service role can update requests"
  on help_requests for update
  using (auth.role() = 'service_role');

create policy "Service role can read offers"
  on help_offers for select
  using (auth.role() = 'service_role');

create policy "Service role can update offers"
  on help_offers for update
  using (auth.role() = 'service_role');
