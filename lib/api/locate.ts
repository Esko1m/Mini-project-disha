import api, { isLocalApiEnabled } from './client';
import { supabase } from '../supabase';
import { buildFromMap } from '../wifi/fingerprint';
import type { APReading, LocateRequest, LocateResponse } from '../../types';

interface StoredFingerprint {
  x: number;
  y: number;
  floor: number;
  readings: APReading[] | null;
}

const FINGERPRINT_CACHE_TTL_MS = 60_000;
const fingerprintCache = new Map<
  string,
  { rows: StoredFingerprint[]; expiresAt: number }
>();

export function clearFingerprintCache(buildingId?: string) {
  if (buildingId) {
    fingerprintCache.delete(buildingId);
  } else {
    fingerprintCache.clear();
  }
}

function nearestFingerprint(
  request: LocateRequest,
  rows: StoredFingerprint[]
): LocateResponse | null {
  if (!request.scan || Object.keys(request.scan).length === 0) return null;

  const bssidSet = new Set<string>();
  for (const row of rows) {
    for (const ap of row.readings ?? []) {
      if (ap?.bssid) bssidSet.add(ap.bssid);
    }
  }
  if (bssidSet.size === 0) return null;

  const hasOverlap = Object.keys(request.scan).some((bssid) => bssidSet.has(bssid));
  if (!hasOverlap) return null;

  const bssids = Array.from(bssidSet);
  const queryVector = buildFromMap(request.scan, bssids);

  let best: StoredFingerprint | null = null;
  let bestDistance = Infinity;
  let secondDistance = Infinity;

  for (const row of rows) {
    if (!row.readings || row.readings.length === 0) continue;

    const scanMap: Record<string, number> = {};
    for (const ap of row.readings) {
      if (ap?.bssid) scanMap[ap.bssid] = ap.rssi;
    }

    const candidate = buildFromMap(scanMap, bssids);
    let sum = 0;
    for (let i = 0; i < bssids.length; i++) {
      const diff = candidate[i] - queryVector[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    if (distance < bestDistance) {
      secondDistance = bestDistance;
      bestDistance = distance;
      best = row;
    } else if (distance < secondDistance) {
      secondDistance = distance;
    }
  }

  if (!best) return null;

  const absolute = Math.max(0, Math.min(1, 1 - bestDistance / 50));
  const margin =
    secondDistance === Infinity
      ? 1
      : Math.max(0, Math.min(1, (secondDistance - bestDistance) / 20));
  const confidence = Math.min(1, absolute * 0.7 + margin * 0.3);

  if (confidence <= 0.05) return null;

  return {
    x: Number(best.x),
    y: Number(best.y),
    floor: Number(best.floor),
    confidence,
  };
}

async function locateWithSupabase(
  request: LocateRequest
): Promise<LocateResponse | null> {
  if (!supabase) return null;

  const cached = fingerprintCache.get(request.building_id);
  if (cached && cached.expiresAt > Date.now()) {
    return nearestFingerprint(request, cached.rows);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const { data, error } = await supabase
      .from('fingerprint_readings')
      .select('x,y,floor,readings')
      .eq('building_id', request.building_id)
      .abortSignal(controller.signal);

    if (error) throw error;
    if (!data || data.length === 0) {
      fingerprintCache.set(request.building_id, {
        rows: [],
        expiresAt: Date.now() + FINGERPRINT_CACHE_TTL_MS,
      });
      return null;
    }

    const rows = data as StoredFingerprint[];
    fingerprintCache.set(request.building_id, {
      rows,
      expiresAt: Date.now() + FINGERPRINT_CACHE_TTL_MS,
    });
    return nearestFingerprint(request, rows);
  } catch {
    // If the network is unavailable, keep using the last successful download.
    if (cached) return nearestFingerprint(request, cached.rows);
    throw new Error('Unable to load fingerprints');
  } finally {
    clearTimeout(timer);
  }
}

export async function locatePosition(
  req: LocateRequest
): Promise<LocateResponse | null> {
  if (!req.scan || Object.keys(req.scan).length === 0) return null;

  try {
    const local = await locateWithSupabase(req);
    if (local) return local;
  } catch {
    // Fall through to the local ML API below.
  }

  if (isLocalApiEnabled) {
    try {
      const res = await api.post('/locate', req);
      return res.data;
    } catch {
      return null;
    }
  }

  return null;
}
