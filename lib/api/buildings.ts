import api, { isLocalApiEnabled } from './client';
import { supabase } from '../supabase';
import type { Building, Floor, NavigationEdge, NavigationNode, PointOfInterest } from '../../types';

export interface BuildingMap {
  building: Building;
  floors: Floor[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: PointOfInterest[];
}

export async function getBuildings(): Promise<Building[]> {
  if (supabase) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name')
        .abortSignal(controller.signal);
      if (!error && data) return data as Building[];
    } catch {
      // Fall through to the local API below.
    } finally {
      clearTimeout(timer);
    }
  }

  if (isLocalApiEnabled) {
    try {
      const res = await api.get('/buildings');
      if (Array.isArray(res.data)) return res.data as Building[];
    } catch {
      // Offline / demo mode.
    }
  }

  return [];
}

export async function getBuildingMap(buildingId: string): Promise<BuildingMap | null> {
  if (supabase) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const [building, floors, nodes, edges, pois] = await Promise.all([
        supabase.from('buildings').select('*').eq('id', buildingId).abortSignal(controller.signal).maybeSingle(),
        supabase.from('floors').select('*').eq('building_id', buildingId).abortSignal(controller.signal),
        supabase.from('navigation_nodes').select('*').eq('building_id', buildingId).abortSignal(controller.signal),
        supabase.from('navigation_edges').select('*').eq('building_id', buildingId).abortSignal(controller.signal),
        supabase.from('points_of_interest').select('*').eq('building_id', buildingId).abortSignal(controller.signal),
      ]);

      const failed = [building, floors, nodes, edges, pois].find(
        (result) => result.error
      );
      if (failed?.error) throw failed.error;

      if (building.data) {
        return {
          building: building.data as Building,
          floors: (floors.data ?? []) as Floor[],
          nodes: (nodes.data ?? []) as NavigationNode[],
          edges: (edges.data ?? []) as NavigationEdge[],
          pois: (pois.data ?? []) as PointOfInterest[],
        };
      }
    } catch {
      // Fall through to the local API below.
    } finally {
      clearTimeout(timer);
    }
  }

  if (isLocalApiEnabled) {
    try {
      const res = await api.get(`/building/${buildingId}/map`);
      return res.data;
    } catch {
      return null;
    }
  }

  return null;
}

export async function recordFingerprint(data: any): Promise<any> {
  const payload = {
    ...data,
    surveyed_at: data.surveyed_at || new Date().toISOString(),
  };

  if (supabase) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const { data: inserted, error } = await supabase
        .from('fingerprint_readings')
        .insert(payload)
        .select()
        .abortSignal(controller.signal)
        .single();
      if (!error && inserted) {
        return { id: inserted.id, message: 'Fingerprint recorded.' };
      }
    } catch {
      // Fall through to the local API below.
    } finally {
      clearTimeout(timer);
    }
  }

  if (isLocalApiEnabled) {
    try {
      const res = await api.post('/fingerprint/record', payload);
      return res.data;
    } catch {
      return null;
    }
  }

  return null;
}

export async function trainBuilding(buildingId: string): Promise<any> {
  if (supabase) {
    return {
      building_id: buildingId,
      status: 'ready',
      mode: 'on-device',
      message: 'Matching runs on-device using the uploaded fingerprints.',
    };
  }

  if (isLocalApiEnabled) {
    try {
      const res = await api.post(`/train/${buildingId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  return null;
}
