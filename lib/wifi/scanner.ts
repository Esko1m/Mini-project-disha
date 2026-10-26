import { Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import type { APReading } from '../../types';

export async function scanWifi(): Promise<APReading[]> {
  if (Platform.OS === 'ios') {
    try {
      const ssid = await WifiManager.getCurrentWifiSSID();
      if (!ssid || ssid === '') return [];
      return [];
    } catch {
      return [];
    }
  }

  try {
    const results = await WifiManager.reScanAndLoadWifiList();
    return (results || []).map((ap: any) => ({
      bssid: ap.BSSID,
      ssid: ap.SSID,
      rssi: ap.level,
      frequency: ap.frequency,
    }));
  } catch (e) {
    try {
      const results = await WifiManager.loadWifiList();
      return (results || []).map((ap: any) => ({
        bssid: ap.BSSID,
        ssid: ap.SSID,
        rssi: ap.level,
        frequency: ap.frequency,
      }));
    } catch {
      return [];
    }
  }
}

export function scanWifiWithTimeout(timeoutMs = 6000): Promise<APReading[]> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve([]);
    }, timeoutMs);

    scanWifi()
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve([]);
      });
  });
}

export function scanToMap(scan: APReading[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const ap of scan) {
    map[ap.bssid] = ap.rssi;
  }
  return map;
}
