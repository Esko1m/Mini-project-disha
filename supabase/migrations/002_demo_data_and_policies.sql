-- Demo buildings. IDs are TEXT so the mobile app demo IDs keep working.
INSERT INTO buildings (id, name, address, city) VALUES
  ('demo-mall', 'City Mall', 'MG Road', 'Bengaluru'),
  ('demo-hospital', 'NIMHANS Convention Centre', 'Hosur Road', 'Bengaluru')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city;

INSERT INTO floors (id, building_id, floor_number, label, width_meters, height_meters) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'demo-mall', 1, 'Ground Floor', 60, 40),
  ('f0000000-0000-4000-8000-000000000002', 'demo-hospital', 1, 'Ground Floor', 60, 40)
ON CONFLICT (id) DO NOTHING;

-- Navigation nodes
INSERT INTO navigation_nodes (id, building_id, floor, x, y, label, type, accessible) VALUES
  ('mall-entrance', 'demo-mall', 1, 0, 0, 'Entrance', 'entrance', true),
  ('mall-corridor', 'demo-mall', 1, 20, 0, 'Main Corridor', 'corridor_junction', true),
  ('mall-pharmacy', 'demo-mall', 1, 40, 0, 'Pharmacy', 'poi', true),
  ('mall-food', 'demo-mall', 1, 30, 10, 'Food Court', 'poi', true),
  ('hosp-entrance', 'demo-hospital', 1, 0, 0, 'Main Entrance', 'entrance', true),
  ('hosp-corridor', 'demo-hospital', 1, 20, 0, 'Reception Corridor', 'corridor_junction', true),
  ('hosp-pharmacy', 'demo-hospital', 1, 40, 0, 'Hospital Pharmacy', 'poi', true),
  ('hosp-emergency', 'demo-hospital', 1, 30, 10, 'Emergency Ward', 'poi', true)
ON CONFLICT (id) DO NOTHING;

-- Navigation edges
INSERT INTO navigation_edges (id, building_id, from_node, to_node, distance_meters, type, heading_degrees) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'demo-mall', 'mall-entrance', 'mall-corridor', 20, 'walk', 0),
  ('e0000000-0000-4000-8000-000000000002', 'demo-mall', 'mall-corridor', 'mall-pharmacy', 20, 'walk', 0),
  ('e0000000-0000-4000-8000-000000000003', 'demo-hospital', 'hosp-entrance', 'hosp-corridor', 20, 'walk', 0),
  ('e0000000-0000-4000-8000-000000000004', 'demo-hospital', 'hosp-corridor', 'hosp-pharmacy', 20, 'walk', 0),
  ('e0000000-0000-4000-8000-000000000005', 'demo-mall', 'mall-corridor', 'mall-food', 14.14, 'walk', 45),
  ('e0000000-0000-4000-8000-000000000006', 'demo-hospital', 'hosp-corridor', 'hosp-emergency', 14.14, 'walk', 45)
ON CONFLICT (id) DO NOTHING;

-- Points of interest
INSERT INTO points_of_interest (id, building_id, floor, x, y, nearest_node, name, category, aliases, accessible) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'demo-mall', 1, 40, 0, 'mall-pharmacy', 'Apollo Pharmacy', 'medical', ARRAY['pharmacy', 'medicine', 'chemist'], true),
  ('b0000000-0000-4000-8000-000000000002', 'demo-mall', 1, 30, 10, 'mall-food', 'Food Court', 'food', ARRAY['food', 'canteen', 'restaurant'], true),
  ('b0000000-0000-4000-8000-000000000003', 'demo-hospital', 1, 40, 0, 'hosp-pharmacy', 'Hospital Pharmacy', 'medical', ARRAY['pharmacy', 'medicine', 'chemist'], true),
  ('b0000000-0000-4000-8000-000000000004', 'demo-hospital', 1, 30, 10, 'hosp-emergency', 'Emergency Ward', 'medical', ARRAY['emergency', 'casualty'], true)
ON CONFLICT (id) DO NOTHING;

-- Row level security: the mobile app uses the publishable (anon) key.
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprint_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read buildings" ON buildings;
CREATE POLICY "Public read buildings" ON buildings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read floors" ON floors;
CREATE POLICY "Public read floors" ON floors
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read navigation nodes" ON navigation_nodes;
CREATE POLICY "Public read navigation nodes" ON navigation_nodes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read navigation edges" ON navigation_edges;
CREATE POLICY "Public read navigation edges" ON navigation_edges
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read points of interest" ON points_of_interest;
CREATE POLICY "Public read points of interest" ON points_of_interest
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read fingerprints" ON fingerprint_readings;
CREATE POLICY "Public read fingerprints" ON fingerprint_readings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert fingerprints" ON fingerprint_readings;
CREATE POLICY "Public insert fingerprints" ON fingerprint_readings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON buildings, floors, navigation_nodes, navigation_edges, points_of_interest TO anon, authenticated;
GRANT SELECT, INSERT ON fingerprint_readings TO anon, authenticated;

-- Ask PostgREST to refresh its schema cache after creating the tables.
NOTIFY pgrst, 'reload schema';
