-- Kōkua Hub v2 — Seed Data
-- Run after schema.sql to populate test data.

-- ============================================================
-- Dashboard Users
-- ============================================================

insert into dashboard_users (email, name, role) values
  ('admin@kokuahub.org', 'Admin', 'admin'),
  ('coordinator1@kokuahub.org', 'Lani K.', 'coordinator'),
  ('coordinator2@kokuahub.org', 'Kai M.', 'coordinator');

-- ============================================================
-- Help Hubs (curated public resources)
-- ============================================================

insert into help_hubs (name, island, area, category, status, hours, notes, public_phone, address, last_verified_at, is_visible) values
  ('Kapolei Shelter', 'Oʻahu', 'Kapolei', 'Shelter', 'Open',
   '24 hours', 'Red Cross managed. Pets allowed in designated area. Cots and blankets provided.',
   '808-555-1001', '91-1001 Farrington Hwy, Kapolei', now(), true),

  ('Mānoa Community Center — Water Distribution', 'Oʻahu', 'Mānoa', 'Water distribution', 'Open',
   '8am–4pm daily', 'Limit 2 cases per household. Bring ID if possible but not required.',
   '808-555-1002', '2969 East Mānoa Rd', now(), true),

  ('Kailua High School — Supply Hub', 'Oʻahu', 'Kailua', 'Supply distribution', 'Open',
   '9am–5pm', 'Tarps, cleaning supplies, trash bags, gloves. First come first served.',
   null, '451 Ulumanu Dr, Kailua', now(), true),

  ('Waimānalo Beach Park — Food Distribution', 'Oʻahu', 'Waimānalo', 'Food distribution', 'Limited',
   '11am–2pm while supplies last', 'Hot meals served by World Central Kitchen volunteers.',
   null, 'Waimānalo Beach Park', now(), true),

  ('Pearl City Charging Station', 'Oʻahu', 'Pearl City', 'Charging station', 'Open',
   '6am–10pm', 'Free phone and device charging. Extension cords and power strips available. Bring your own cable.',
   null, 'Pearl City Public Library', now(), true),

  ('Kahului Civic Center Shelter', 'Maui', 'Kahului', 'Shelter', 'Open',
   '24 hours', 'Managed by county emergency services. Capacity approximately 200.',
   '808-555-1003', 'Kahului Civic Center', now(), true),

  ('Kīhei Community Center — Donations', 'Maui', 'Kīhei', 'Donation drop-off', 'Open',
   '8am–6pm', 'Accepting clean clothing, non-perishable food, hygiene items. No furniture at this time.',
   '808-555-1004', 'Kīhei Community Center', now(), true),

  ('Līhuʻe Neighborhood Center', 'Kauaʻi', 'Līhuʻe', 'Supply distribution', 'Open',
   '9am–3pm', 'Cleanup supplies and water. FEMA representatives available for questions.',
   '808-555-1005', '3353 Eono St, Līhuʻe', now(), true),

  ('Hilo Civic Auditorium Shelter', 'Hawaiʻi (Big Island)', 'Hilo', 'Shelter', 'Closed',
   null, 'Closed as of 3/22. Residents relocated to alternate housing.',
   null, '323 Manono St, Hilo', now() - interval '1 day', true),

  ('Downtown Honolulu Volunteer Hub', 'Oʻahu', 'Downtown Honolulu', 'Volunteer hub', 'Open',
   '7am–7pm', 'Check in here for volunteer assignments. Bring closed-toe shoes and water.',
   '808-555-1006', 'Honolulu Hale Grounds', now(), true);

-- A few hidden hubs (not yet verified)
insert into help_hubs (name, island, area, category, status, notes, is_visible) values
  ('Waipahu Community Laundry Station', 'Oʻahu', 'Waipahu', 'Laundry', 'Unknown',
   'Reported via community tip. Needs verification.', false),
  ('Hanalei School Temporary Showers', 'Kauaʻi', 'Hanalei', 'Shower', 'Unknown',
   'Unverified community report.', false);

-- ============================================================
-- Public Need Summaries (coordinator-authored)
-- ============================================================

insert into public_need_summaries (island, area, title, description, category, urgency, is_visible) values
  ('Oʻahu', 'Windward Side', 'Cleanup volunteers needed in Kailua and Waimānalo',
   'Significant mud and debris in residential areas. Teams of 4–6 people needed for shoveling and hauling. Bring closed-toe shoes if you can.',
   'Volunteers needed', 'Urgent', true),

  ('Oʻahu', 'North Shore', 'Tarps and plastic sheeting needed',
   'Multiple homes with roof damage from Hau''ula to Sunset Beach. Large tarps (10x12 or bigger) are most useful.',
   'Supplies needed', 'High', true),

  ('Oʻahu', null, 'Drivers with trucks needed for supply delivery',
   'We have supplies staged at multiple locations but need vehicles to deliver them to affected neighborhoods, especially the windward side.',
   'Transportation needed', 'High', true),

  ('Maui', 'Central Maui', 'Non-perishable food donations needed',
   'Shelters in Kahului and Wailuku are running low on shelf-stable food. Canned goods, rice, and dried meals are most helpful.',
   'Donations needed', 'Normal', true),

  ('Kauaʻi', 'North Shore', 'Bilingual volunteers (English/Tagalog) needed',
   'Several families in the Hanalei area speak primarily Tagalog. Need volunteers who can translate during intake and wellness checks.',
   'Skilled help needed', 'High', true),

  ('Oʻahu', 'Pearl City', 'Generators and fuel needed',
   'Extended power outages in Pearl City and ʻAiea. Portable generators would help families with medical equipment.',
   'Supplies needed', 'Urgent', true);

-- ============================================================
-- Volunteers (test signups)
-- ============================================================

insert into volunteers (name, island, neighborhood, skills, availability, contact_method, contact_value, languages, has_vehicle, note, status) values
  ('Keoni P.', 'Oʻahu', 'Kaimukī', '{"General labor","Driving / delivery"}', 'Today', 'Phone', '808-555-2001',
   'English, Hawaiian', true, 'Have a pickup truck. Available mornings.', 'Active'),

  ('Maria S.', 'Oʻahu', 'Mililani', '{"Cooking","Organizing / coordination"}', 'This week', 'Email', 'maria.s@example.com',
   'English, Tagalog', false, 'Can help coordinate food prep teams. Church kitchen available.', 'New'),

  ('David L.', 'Oʻahu', 'Hawaiʻi Kai', '{"General labor","Tech / communications"}', 'Next 24 hours', 'Phone', '808-555-2002',
   'English', true, 'IT background — can help set up comms gear or do physical work.', 'New'),

  ('Akiko T.', 'Maui', 'Kīhei', '{"Translation","Counseling"}', 'Ongoing', 'Email', 'akiko.t@example.com',
   'English, Japanese', false, 'Licensed social worker. Can provide crisis counseling and translate for Japanese-speaking families.', 'Active'),

  ('Bruddah Mike', 'Oʻahu', 'Waiʻanae', '{"General labor","Driving / delivery"}', 'Today', 'Phone', '808-555-2003',
   'English, Hawaiian, Pidgin', true, 'Got one flatbed. Know the west side roads good.', 'New');

-- ============================================================
-- Review Queue Items (community-submitted tips)
-- ============================================================

insert into review_queue_items (submitted_name, submitted_island, submitted_area, submitted_info, submitted_category, submitted_contact, status) values
  ('Sarah K.', 'Oʻahu', 'Waipahu', 'Waipahu District Park has a laundry station set up by volunteers. I think they have 4 washers running off generators. Open during daylight hours.',
   'Laundry', 'sarah.k@example.com', 'Pending'),

  (null, 'Kauaʻi', 'Hanalei', 'Hanalei Elementary has portable showers in the parking lot. Not sure who set them up but they were running yesterday.',
   'Shower', null, 'Pending'),

  ('Tom W.', 'Oʻahu', 'Kalihi', 'Kalihi Valley Homes community room has become an unofficial supply distribution point. Neighbors are collecting and sharing. They could use more organization help.',
   'Supply distribution', '808-555-3001', 'Pending'),

  ('Auntie Lei', 'Maui', 'Pāʻia', 'Pāʻia Community Center is serving lunch and dinner. Not sure if it''s official but the food is good and there''s plenty.',
   'Food distribution', null, 'Pending');

-- ============================================================
-- Help Requests (private — minimal test data, clearly fake)
-- ============================================================

insert into help_requests (island, neighborhood, need_types, urgency, contact_method, contact_value, note, can_be_contacted, status) values
  ('Oʻahu', 'Mānoa', '{"Water","Food"}', 'Urgent', 'Phone', '808-555-0001', 'Test request — family of 4 needs water and food.', true, 'New'),
  ('Oʻahu', 'Kailua', '{"Cleanup help"}', 'Soon', 'Phone', '808-555-0002', 'Test request — mud in lower level needs clearing.', true, 'Reviewing'),
  ('Maui', 'Kahului', '{"Transportation"}', 'Soon', 'Email', 'test@example.com', 'Test request — needs ride to shelter.', false, 'New');

-- ============================================================
-- Help Offers (private — minimal test data)
-- ============================================================

insert into help_offers (island, neighborhood, offer_types, availability, contact_method, contact_value, note, capacity, status) values
  ('Oʻahu', 'Kaimukī', '{"Food / water"}', 'Today', 'Phone', '808-555-0101', 'Test offer — cases of water available.', '10 cases', 'New'),
  ('Oʻahu', 'Hawaiʻi Kai', '{"Transportation"}', 'Next 24 hours', 'Phone', '808-555-0102', 'Test offer — pickup truck available.', '1 truck', 'Available');
