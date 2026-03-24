alter table if exists help_hubs
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table if exists donation_links
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_hubs_geo
  on help_hubs(latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists idx_donation_links_geo
  on donation_links(latitude, longitude)
  where latitude is not null and longitude is not null;
