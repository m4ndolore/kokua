create table if not exists geo_reference_nodes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  key text unique not null,
  name text not null,
  island text,
  area text,
  latitude double precision not null,
  longitude double precision not null,
  radius_km double precision,
  notice_type text,
  notes text,
  is_active boolean not null default true
);

alter table if exists help_hubs
  add column if not exists external_id text unique,
  add column if not exists geo_reference_node_id uuid references geo_reference_nodes(id);

alter table if exists public_need_summaries
  add column if not exists external_id text unique,
  add column if not exists geo_reference_node_id uuid references geo_reference_nodes(id);

create index if not exists idx_geo_reference_nodes_key
  on geo_reference_nodes(key);

create index if not exists idx_geo_reference_nodes_island
  on geo_reference_nodes(island);

create index if not exists idx_geo_reference_nodes_active
  on geo_reference_nodes(is_active)
  where is_active = true;

create index if not exists idx_hubs_external_id
  on help_hubs(external_id)
  where external_id is not null;

create index if not exists idx_hubs_geo_reference
  on help_hubs(geo_reference_node_id)
  where geo_reference_node_id is not null;

create index if not exists idx_summaries_external_id
  on public_need_summaries(external_id)
  where external_id is not null;

create index if not exists idx_summaries_geo_reference
  on public_need_summaries(geo_reference_node_id)
  where geo_reference_node_id is not null;

alter table geo_reference_nodes enable row level security;

create policy "Public can read active geo reference nodes"
  on geo_reference_nodes for select
  using (is_active = true);

create policy "Service role full access to geo_reference_nodes"
  on geo_reference_nodes for all using (auth.role() = 'service_role');
