-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id   TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number  INTEGER NOT NULL,
  label         TEXT,
  floor_plan_url TEXT,
  width_meters  FLOAT,
  height_meters FLOAT
);

-- WiFi Fingerprint Readings
CREATE TABLE IF NOT EXISTS fingerprint_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  floor       INTEGER NOT NULL,
  x           FLOAT NOT NULL,
  y           FLOAT NOT NULL,
  label       TEXT,
  readings    JSONB NOT NULL,
  surveyed_at TIMESTAMPTZ DEFAULT NOW(),
  surveyor_id UUID
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_building ON fingerprint_readings(building_id);

-- Navigation Graph Nodes
CREATE TABLE IF NOT EXISTS navigation_nodes (
  id          TEXT PRIMARY KEY,
  building_id TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  floor       INTEGER NOT NULL,
  x           FLOAT NOT NULL,
  y           FLOAT NOT NULL,
  label       TEXT NOT NULL,
  type        TEXT NOT NULL,
  accessible  BOOLEAN DEFAULT TRUE
);

-- Navigation Graph Edges
CREATE TABLE IF NOT EXISTS navigation_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  from_node       TEXT REFERENCES navigation_nodes(id),
  to_node         TEXT REFERENCES navigation_nodes(id),
  distance_meters FLOAT NOT NULL,
  type            TEXT NOT NULL,
  heading_degrees FLOAT,
  description     TEXT
);

-- Points of Interest
CREATE TABLE IF NOT EXISTS points_of_interest (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id  TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  floor        INTEGER NOT NULL,
  x            FLOAT NOT NULL,
  y            FLOAT NOT NULL,
  nearest_node TEXT REFERENCES navigation_nodes(id),
  name         TEXT NOT NULL,
  category     TEXT,
  aliases      TEXT[],
  accessible   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_poi_building ON points_of_interest(building_id);
