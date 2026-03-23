-- Kōkua Hub v3 — Seed Data (Source-Aware)
-- Run after schema.sql

-- ============================================================
-- Dashboard Users
-- ============================================================

insert into dashboard_users (email, name, role) values
  ('admin@kokuahub.org', 'Admin', 'admin'),
  ('lani@kokuahub.org', 'Lani K.', 'coordinator'),
  ('kai@kokuahub.org', 'Kai M.', 'coordinator');

-- ============================================================
-- Source Registry
-- ============================================================

insert into source_registry (id, name, source_type, platform, base_url, organization, trust_level, update_frequency, strategy, notes) values
  ('a0000000-0000-0000-0000-000000000001', 'Hawaiʻi Emergency Management Agency', 'official', 'website', 'https://dod.hawaii.gov/hiema/', 'State of Hawaiʻi', 'high', 'daily', 'monitor', 'Primary state emergency info source.'),
  ('a0000000-0000-0000-0000-000000000002', 'Honolulu County Civil Defense', 'official', 'website', null, 'City & County of Honolulu', 'high', 'daily', 'monitor', 'Oʻahu-specific shelter and road info.'),
  ('a0000000-0000-0000-0000-000000000003', 'American Red Cross Hawaiʻi', 'nonprofit', 'website', null, 'American Red Cross', 'high', 'daily', 'monitor', 'Shelter operations and supply distribution.'),
  ('a0000000-0000-0000-0000-000000000004', 'World Central Kitchen', 'nonprofit', 'website', null, 'World Central Kitchen', 'high', 'ad_hoc', 'monitor', 'Hot meal distribution sites.'),
  ('a0000000-0000-0000-0000-000000000005', 'Maui County Emergency', 'official', 'website', null, 'County of Maui', 'high', 'daily', 'monitor', null),
  ('a0000000-0000-0000-0000-000000000006', 'Hawaiʻi Flood Relief Facebook Group', 'social', 'facebook', null, null, 'low', 'realtime', 'monitor', 'Community group — high volume, needs verification.'),
  ('a0000000-0000-0000-0000-000000000007', 'Kōkua Hub Community Tips', 'community', 'website', null, 'Kōkua Hub', 'medium', 'realtime', 'monitor', 'Tips submitted via /can-help/share-info.'),
  ('a0000000-0000-0000-0000-000000000008', 'Kōkua Hub Internal', 'internal', null, null, 'Kōkua Hub', 'high', 'ad_hoc', 'monitor', 'Coordinator-created entries.');

-- ============================================================
-- Help Hubs (with source provenance)
-- ============================================================

insert into help_hubs (name, island, area, category, status, hours, notes, public_phone, address, source_name, source_type, source_url, source_registry_id, confidence, last_verified_at, visibility_status) values
  ('Kapolei Shelter', 'Oʻahu', 'Kapolei', 'Shelter', 'Open',
   '24 hours', 'Red Cross managed. Pets allowed in designated area. Cots and blankets provided.',
   '808-555-1001', '91-1001 Farrington Hwy, Kapolei',
   'American Red Cross Hawaiʻi', 'nonprofit', null, 'a0000000-0000-0000-0000-000000000003', 'high', now(), 'public'),

  ('Mānoa Community Center — Water Distribution', 'Oʻahu', 'Mānoa', 'Water distribution', 'Open',
   '8am–4pm daily', 'Limit 2 cases per household. Bring ID if possible but not required.',
   '808-555-1002', '2969 East Mānoa Rd',
   'Honolulu County Civil Defense', 'official', null, 'a0000000-0000-0000-0000-000000000002', 'high', now(), 'public'),

  ('Kailua High School — Supply Hub', 'Oʻahu', 'Kailua', 'Supply distribution', 'Open',
   '9am–5pm', 'Tarps, cleaning supplies, trash bags, gloves. First come first served.',
   null, '451 Ulumanu Dr, Kailua',
   'Honolulu County Civil Defense', 'official', null, 'a0000000-0000-0000-0000-000000000002', 'high', now(), 'public'),

  ('Waimānalo Beach Park — Food Distribution', 'Oʻahu', 'Waimānalo', 'Food distribution', 'Limited',
   '11am–2pm while supplies last', 'Hot meals served by World Central Kitchen volunteers.',
   null, 'Waimānalo Beach Park',
   'World Central Kitchen', 'nonprofit', null, 'a0000000-0000-0000-0000-000000000004', 'high', now(), 'public'),

  ('Pearl City Charging Station', 'Oʻahu', 'Pearl City', 'Charging station', 'Open',
   '6am–10pm', 'Free phone and device charging. Extension cords and power strips available.',
   null, 'Pearl City Public Library',
   'Kōkua Hub Internal', 'internal', null, 'a0000000-0000-0000-0000-000000000008', 'medium', now(), 'public'),

  ('Kahului Civic Center Shelter', 'Maui', 'Kahului', 'Shelter', 'Open',
   '24 hours', 'Managed by county emergency services. Capacity approximately 200.',
   '808-555-1003', 'Kahului Civic Center',
   'Maui County Emergency', 'official', null, 'a0000000-0000-0000-0000-000000000005', 'high', now(), 'public'),

  ('Kīhei Community Center — Donations', 'Maui', 'Kīhei', 'Donation drop-off', 'Open',
   '8am–6pm', 'Accepting clean clothing, non-perishable food, hygiene items.',
   '808-555-1004', 'Kīhei Community Center',
   'Maui County Emergency', 'official', null, 'a0000000-0000-0000-0000-000000000005', 'high', now(), 'public'),

  ('Līhuʻe Neighborhood Center', 'Kauaʻi', 'Līhuʻe', 'Supply distribution', 'Open',
   '9am–3pm', 'Cleanup supplies and water. FEMA representatives available.',
   '808-555-1005', '3353 Eono St, Līhuʻe',
   'Hawaiʻi Emergency Management Agency', 'official', null, 'a0000000-0000-0000-0000-000000000001', 'high', now(), 'public'),

  ('Downtown Honolulu Volunteer Hub', 'Oʻahu', 'Downtown Honolulu', 'Volunteer hub', 'Open',
   '7am–7pm', 'Check in here for volunteer assignments. Bring closed-toe shoes and water.',
   '808-555-1006', 'Honolulu Hale Grounds',
   'Kōkua Hub Internal', 'internal', null, 'a0000000-0000-0000-0000-000000000008', 'medium', now(), 'public'),

  ('Hilo Civic Auditorium Shelter', 'Hawaiʻi (Big Island)', 'Hilo', 'Shelter', 'Closed',
   null, 'Closed as of 3/22. Residents relocated.',
   null, '323 Manono St, Hilo',
   'Hawaiʻi Emergency Management Agency', 'official', null, 'a0000000-0000-0000-0000-000000000001', 'high', now() - interval '1 day', 'public');

-- Hubs in review (not yet visible)
insert into help_hubs (name, island, area, category, status, notes, source_name, source_type, source_registry_id, confidence, visibility_status) values
  ('Waipahu Community Laundry Station', 'Oʻahu', 'Waipahu', 'Laundry', 'Unknown',
   'Reported via community tip. Needs verification.',
   'Kōkua Hub Community Tips', 'community', 'a0000000-0000-0000-0000-000000000007', 'low', 'review'),
  ('Hanalei School Temporary Showers', 'Kauaʻi', 'Hanalei', 'Shower', 'Unknown',
   'Unverified community report.',
   'Kōkua Hub Community Tips', 'community', 'a0000000-0000-0000-0000-000000000007', 'low', 'review');

-- ============================================================
-- Public Need Summaries (with source provenance)
-- ============================================================

insert into public_need_summaries (island, area, title, description, category, urgency, source_name, source_type, source_registry_id, confidence, last_verified_at, visibility_status) values
  ('Oʻahu', 'Windward Side', 'Cleanup volunteers needed in Kailua and Waimānalo',
   'Significant mud and debris in residential areas. Teams of 4–6 people needed for shoveling and hauling.',
   'Volunteers needed', 'Urgent',
   'Kōkua Hub Internal', 'internal', 'a0000000-0000-0000-0000-000000000008', 'high', now(), 'public'),

  ('Oʻahu', 'North Shore', 'Tarps and plastic sheeting needed',
   'Multiple homes with roof damage from Hauʻula to Sunset Beach. Large tarps (10x12 or bigger) most useful.',
   'Supplies needed', 'High',
   'Honolulu County Civil Defense', 'official', 'a0000000-0000-0000-0000-000000000002', 'high', now(), 'public'),

  ('Oʻahu', null, 'Drivers with trucks needed for supply delivery',
   'Supplies staged at multiple locations but need vehicles to deliver to affected neighborhoods.',
   'Transportation needed', 'High',
   'Kōkua Hub Internal', 'internal', 'a0000000-0000-0000-0000-000000000008', 'high', now(), 'public'),

  ('Maui', 'Central Maui', 'Non-perishable food donations needed',
   'Shelters in Kahului and Wailuku running low on shelf-stable food.',
   'Donations needed', 'Normal',
   'American Red Cross Hawaiʻi', 'nonprofit', 'a0000000-0000-0000-0000-000000000003', 'high', now(), 'public'),

  ('Kauaʻi', 'North Shore', 'Bilingual volunteers (English/Tagalog) needed',
   'Several families in Hanalei area speak primarily Tagalog. Need translators for intake and wellness checks.',
   'Skilled help needed', 'High',
   'Kōkua Hub Internal', 'internal', 'a0000000-0000-0000-0000-000000000008', 'medium', now(), 'public'),

  ('Oʻahu', 'Pearl City', 'Generators and fuel needed',
   'Extended power outages in Pearl City and ʻAiea. Portable generators needed for medical equipment.',
   'Supplies needed', 'Urgent',
   'Kōkua Hub Internal', 'internal', 'a0000000-0000-0000-0000-000000000008', 'medium', now(), 'public');

-- ============================================================
-- Source Signals
-- ============================================================

insert into source_signals (source_registry_id, title, signal_type, island, area, derived_resource_name, derived_resource_type, derived_status, confidence, raw_text, last_observed_at, needs_review, review_reason, review_status) values
  ('a0000000-0000-0000-0000-000000000002', 'Kapolei Shelter capacity at 70%', 'update', 'Oʻahu', 'Kapolei',
   'Kapolei Shelter', 'Shelter', 'active', 'high',
   'Kapolei Shelter at 70% capacity as of 3pm. Accepting new arrivals.',
   now(), false, null, 'approved'),

  ('a0000000-0000-0000-0000-000000000006', 'Facebook: water station at Kailua High', 'resource', 'Oʻahu', 'Kailua',
   'Kailua High Water Station', 'Water distribution', 'active', 'low',
   'Someone set up a water station at Kailua High parking lot. Looks like bottled water and ice.',
   now(), true, 'Social media source — needs verification', 'pending'),

  ('a0000000-0000-0000-0000-000000000006', 'Facebook: road closure Kamehameha Hwy', 'route_change', 'Oʻahu', 'North Shore',
   null, null, null, 'low',
   'Kamehameha Hwy closed between Hauʻula and Kaʻaʻawa due to flooding. Use Likelike or H3.',
   now(), true, 'Social media — road info needs official confirmation', 'pending'),

  ('a0000000-0000-0000-0000-000000000004', 'WCK Waimānalo meals ending Friday', 'closure', 'Oʻahu', 'Waimānalo',
   'Waimānalo Beach Park — Food Distribution', 'Food distribution', 'limited', 'medium',
   'WCK plans to wind down Waimānalo operations by Friday. Last meal service Saturday.',
   now(), true, 'Closure notice — verify before updating public listing', 'pending'),

  ('a0000000-0000-0000-0000-000000000001', 'HIEMA: new supply point at Wahiawā', 'resource', 'Oʻahu', 'Wahiawā',
   'Wahiawā District Park Supply Distribution', 'Supply distribution', 'planned', 'high',
   'HIEMA announces new supply distribution point at Wahiawā District Park starting Monday 8am.',
   now(), false, null, 'approved'),

  (null, 'Unattributed: someone offering free laundry in Kalihi', 'resource', 'Oʻahu', 'Kalihi',
   'Kalihi Laundry Service', 'Laundry', 'unknown', 'low',
   'Heard from a neighbor that someone is running free laundry loads in Kalihi. No address or details.',
   now(), true, 'No source — needs verification', 'pending');

-- ============================================================
-- Volunteers
-- ============================================================

insert into volunteers (name, island, neighborhood, skills, availability, contact_method, contact_value, languages, has_vehicle, note, status) values
  ('Keoni P.', 'Oʻahu', 'Kaimukī', '{"General labor","Driving / delivery"}', 'Today', 'Phone', '808-555-2001',
   'English, Hawaiian', true, 'Have a pickup truck. Available mornings.', 'Active'),
  ('Maria S.', 'Oʻahu', 'Mililani', '{"Cooking","Organizing / coordination"}', 'This week', 'Email', 'maria.s@example.com',
   'English, Tagalog', false, 'Can help coordinate food prep teams.', 'New'),
  ('David L.', 'Oʻahu', 'Hawaiʻi Kai', '{"General labor","Tech / communications"}', 'Next 24 hours', 'Phone', '808-555-2002',
   'English', true, 'IT background — can help with comms gear or physical work.', 'New'),
  ('Akiko T.', 'Maui', 'Kīhei', '{"Translation","Counseling"}', 'Ongoing', 'Email', 'akiko.t@example.com',
   'English, Japanese', false, 'Licensed social worker. Crisis counseling and translation.', 'Active'),
  ('Bruddah Mike', 'Oʻahu', 'Waiʻanae', '{"General labor","Driving / delivery"}', 'Today', 'Phone', '808-555-2003',
   'English, Hawaiian, Pidgin', true, 'Got one flatbed. Know the west side roads good.', 'New');

-- ============================================================
-- Review Queue Items
-- ============================================================

insert into review_queue_items (origin, submitted_name, submitted_island, submitted_area, submitted_info, submitted_category, submitted_contact, status) values
  ('community_tip', 'Sarah K.', 'Oʻahu', 'Waipahu', 'Waipahu District Park has a laundry station set up by volunteers. 4 washers running off generators.', 'Laundry', 'sarah.k@example.com', 'Pending'),
  ('community_tip', null, 'Kauaʻi', 'Hanalei', 'Hanalei Elementary has portable showers in the parking lot.', 'Shower', null, 'Pending'),
  ('community_tip', 'Tom W.', 'Oʻahu', 'Kalihi', 'Kalihi Valley Homes community room is an unofficial supply point. Neighbors collecting and sharing.', 'Supply distribution', '808-555-3001', 'Pending'),
  ('community_tip', 'Auntie Lei', 'Maui', 'Pāʻia', 'Pāʻia Community Center serving lunch and dinner.', 'Food distribution', null, 'Pending');

-- Feedback items
insert into review_queue_items (origin, feedback_category, feedback_message, feedback_contact, status) values
  ('feedback', 'report_issue', 'The Kailua High School supply hub listing says 9am-5pm but when I went there at 9:30am they were not open yet. Maybe hours changed?', 'test@example.com', 'Pending'),
  ('feedback', 'suggest_resource', 'There is a free laundry service at Waipahu Community Center, not sure if you have that listed already.', null, 'Pending'),
  ('feedback', 'feature_request', 'It would be great if you could show a map of all the help hubs so I can find the closest one.', null, 'Pending');

-- ============================================================
-- Help Requests (minimal test data — clearly fake)
-- ============================================================

insert into help_requests (island, neighborhood, need_types, urgency, contact_method, contact_value, note, can_be_contacted, status) values
  ('Oʻahu', 'Mānoa', '{"Water","Food"}', 'Urgent', 'Phone', '808-555-0001', 'Test request.', true, 'New'),
  ('Oʻahu', 'Kailua', '{"Cleanup help"}', 'Soon', 'Phone', '808-555-0002', 'Test request.', true, 'Reviewing'),
  ('Maui', 'Kahului', '{"Transportation"}', 'Soon', 'Email', 'test@example.com', 'Test request.', false, 'New');

-- ============================================================
-- Help Offers (minimal test data)
-- ============================================================

insert into help_offers (island, neighborhood, offer_types, availability, contact_method, contact_value, note, capacity, status) values
  ('Oʻahu', 'Kaimukī', '{"Food / water"}', 'Today', 'Phone', '808-555-0101', 'Test offer.', '10 cases water', 'New'),
  ('Oʻahu', 'Hawaiʻi Kai', '{"Transportation"}', 'Next 24 hours', 'Phone', '808-555-0102', 'Test offer.', '1 truck', 'Available');
