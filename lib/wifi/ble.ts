import { Platform } from 'react-native';

// BLE fallback stub for iOS - placeholder for future integration with react-native-ble-plx
export async function scanBle(): Promise<Array<{ id: string; rssi: number }>> {
  if (Platform.OS !== 'ios') return [];
  return [];
}
