-- Seed data for testing Kōkua Hub
-- Realistic Hawaii flood response scenarios

insert into help_requests (island, neighborhood, need_types, urgency, contact_method, contact_value, note, can_be_contacted, status) values
  ('Oʻahu', 'Mānoa', '{"Food","Water"}', 'Urgent', 'Phone', '808-555-0101', 'Family of 4, ground floor flooded overnight. Running low on clean water and food. Kids are 3 and 7.', true, 'New'),
  ('Oʻahu', 'Kailua', '{"Cleanup help"}', 'Soon', 'Phone', '808-555-0102', 'About 2 feet of mud in carport and lower level. Would appreciate any help shoveling out.', true, 'New'),
  ('Oʻahu', 'Waimānalo', '{"Temporary shelter"}', 'Urgent', 'Phone', '808-555-0103', 'Roof partially collapsed. Not safe to stay. Two adults, one child. Staying with neighbor for now but need a longer-term option.', true, 'Reviewing'),
  ('Oʻahu', 'Hau''ula', '{"Wellness check"}', 'Urgent', 'Phone', '808-555-0104', 'Elderly uncle lives alone off Kamehameha Hwy. Road may be blocked. Haven''t been able to reach him since yesterday.', true, 'New'),
  ('Oʻahu', 'Pearl City', '{"Supplies"}', 'Flexible', 'Email', 'keiki.ohana@example.com', 'Power has been out two days. Could use batteries, flashlights, and a portable phone charger if anyone has extras.', false, 'New'),
  ('Oʻahu', 'Wahiawā', '{"Food","Water","Supplies"}', 'Soon', 'Phone', '808-555-0105', 'Multiple families on our street need supplies. We can coordinate distribution if someone can deliver.', true, 'New'),
  ('Maui', 'Kahului', '{"Transportation"}', 'Soon', 'Phone', '808-555-0106', 'Car flooded. Need a ride to the shelter at War Memorial. Have mobility issues — need vehicle I can get into easily.', false, 'New'),
  ('Kauaʻi', 'Hanalei', '{"Cleanup help","Supplies"}', 'Flexible', 'Email', 'hanalei.help@example.com', 'Stream overflowed into yard and first floor. Carpet, furniture heavily damaged. Need tarps, trash bags, and extra hands.', true, 'Matched');

insert into help_offers (island, neighborhood, offer_types, availability, contact_method, contact_value, note, capacity, status) values
  ('Oʻahu', 'Kaimukī', '{"Food / water"}', 'Today', 'Phone', '808-555-0201', 'Picked up extra cases of water and rice from Costco. Happy to drop off or have someone pick up.', '10 cases water, 4 bags rice', 'New'),
  ('Oʻahu', 'Hawaiʻi Kai', '{"Transportation"}', 'Next 24 hours', 'Phone', '808-555-0202', 'Have a pickup truck. Can help move people or supplies around the east side today and tomorrow.', '1 pickup truck, can fit 3 passengers', 'Available'),
  ('Oʻahu', 'Mililani', '{"Labor / cleanup help"}', 'This week', 'Email', 'mililani.crew@example.com', 'Group of 5 from our church ready to help with mud cleanup. We have shovels and wheelbarrows.', '5 volunteers with tools', 'New'),
  ('Maui', 'Kīhei', '{"Shelter space"}', 'Today', 'Phone', '808-555-0203', 'Have a spare bedroom and a pullout couch. Family with kids welcome. We have a dog — just a heads up.', '1 bedroom, fits 2-3 people', 'Available'),
  ('Oʻahu', 'Kalihi', '{"Supplies"}', 'Today', 'Phone', '808-555-0204', 'Have extra tarps, buckets, and bleach for cleanup. Also some baby formula and diapers.', 'Assorted supplies', 'New'),
  ('Oʻahu', 'ʻAiea', '{"Storage space"}', 'This week', 'Email', 'aiea.storage@example.com', 'Garage is available for staging supplies. Dry, covered, and lockable. Near Pearl City.', '~250 sq ft covered space', 'New');
