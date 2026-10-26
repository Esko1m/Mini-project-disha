import type { APReading } from '../../types';

const RSSI_MISSING = -100;

export interface FingerprintVector {
  bssids: string[];
  rssiValues: number[];
  timestamp: number;
}

export function buildVector(scan: APReading[], knownBssids: string[]): number[] {
  const scanMap = new Map<string, number>();
  for (const ap of scan) scanMap.set(ap.bssid, ap.rssi);
  return knownBssids.map((bssid) => scanMap.get(bssid) ?? RSSI_MISSING);
}

export function buildFromMap(scanMap: Record<string, number>, knownBssids: string[]): number[] {
  return knownBssids.map((bssid) => scanMap[bssid] ?? RSSI_MISSING);
}
