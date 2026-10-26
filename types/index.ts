export interface APReading {
  bssid: string;
  ssid: string;
  rssi: number;
  frequency: number;
}

export interface FingerprintReading {
  id?: string;
  building_id: string;
  floor: number;
  x: number;
  y: number;
  label?: string;
  readings: APReading[];
  surveyed_at?: string;
  surveyor_id?: string;
}

export interface NavigationNode {
  id: string;
  building_id: string;
  floor: number;
  x: number;
  y: number;
  label: string;
  type: 'entrance' | 'elevator' | 'stairs' | 'escalator' | 'corridor_junction' | 'poi' | 'exit';
  accessible: boolean;
}

export interface NavigationEdge {
  id: string;
  building_id: string;
  from_node: string;
  to_node: string;
  distance_meters: number;
  type: 'walk' | 'elevator' | 'stairs' | 'escalator' | 'exit';
  heading_degrees?: number;
  description?: string;
}

export interface PointOfInterest {
  id: string;
  building_id: string;
  floor: number;
  x: number;
  y: number;
  nearest_node?: string;
  name: string;
  category?: string;
  aliases?: string[];
  accessible: boolean;
}

export interface Building {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

export interface Floor {
  id?: string;
  building_id: string;
  floor_number: number;
  label?: string;
  floor_plan_url?: string;
  width_meters?: number;
  height_meters?: number;
}

export interface LocateRequest {
  building_id: string;
  scan: Record<string, number>;
}

export interface LocateResponse {
  x: number;
  y: number;
  floor: number;
  confidence: number;
  nearest_node?: string;
}

export type Intent =
  | { type: 'navigate'; destination: string }
  | { type: 'where_am_i' }
  | { type: 'repeat' }
  | { type: 'how_far' }
  | { type: 'stop' }
  | { type: 'help' }
  | { type: 'whats_around' }
  | { type: 'unknown' };
