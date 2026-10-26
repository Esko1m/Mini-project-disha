# 🧭 IndoorNav — WiFi-Based Indoor Navigation for Visually Impaired

> A mobile application that helps visually impaired people navigate inside rooms and buildings using WiFi signal fingerprinting — no new hardware required.

---

## Overview

IndoorNav uses the WiFi signals already present in any building to determine a user's position indoors. By mapping signal strengths (RSSI) from surrounding access points at known locations, the app can estimate where the user is and provide turn-by-turn audio navigation to guide them safely.

**No beacons. No special hardware. Just existing WiFi.**

---

## How It Works

```
[Mapping Phase]
  Admin walks the room → app captures WiFi RSSI at each position
  → builds a fingerprint map → exports as JSON

[Navigation Phase]
  User opens app → scans WiFi → matches against fingerprint map
  → estimates position → gives audio directions via TTS
```

The position matching uses a **k-Nearest Neighbors (k-NN)** algorithm comparing live RSSI vectors against stored fingerprints — runs fully on-device, no internet required.

---

## Features

- 📡 WiFi RSSI fingerprint capture at wall corners and grid points
- 🧮 On-device k-NN position estimation (no server needed)
- 🔊 Turn-by-turn audio navigation via Text-to-Speech
- 📳 Haptic feedback for confirmations and proximity alerts
- 📤 Export / import fingerprint maps as JSON
- 🏢 Works in any indoor environment — rooms, corridors, halls
- 🔋 Offline-first — works without internet after mapping

---

## Target Environments

- Homes
- Hospital wards
- College buildings
- Shopping malls
- Office spaces

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 58 (prebuild / bare Android) |
| Language | TypeScript |
| Navigation | Expo Router + Zustand |
| WiFi Scanning | `react-native-wifi-reborn` |
| Audio | `expo-speech` + `expo-speech-recognition` |
| Haptics | `expo-haptics` |
| Storage | `expo-sqlite` + Supabase Postgres |
| Sensors | `expo-sensors` (accelerometer + magnetometer dead-reckoning) |
| Map rendering | `react-native-svg` |

---

## Platform Support

| Platform | WiFi Scanning | Status |
|---|---|---|
| Android | ✅ Native WiFi RSSI scan | Phase 1 — Active |
| iOS | ❌ Apple blocks WiFi AP scanning | Phase 4 — BLE beacons |

> iOS support is planned for Phase 4 using BLE beacons placed at room corners, feeding the same k-NN algorithm with identical JSON format.

---

## Project Structure

```
/app
  /(onboarding)               ← welcome and permission setup
  /(navigation)               ← home, building picker, destination, navigation, settings
  /(surveyor)                 ← building/floor picker, fingerprint capture, upload review
/components                   ← FloorMap, voice button, instruction banner
/lib/api                      ← Supabase building/map/fingerprint APIs
/lib/navigation               ← pathfinding, instructions, dead reckoning, POI matching
/lib/speech                   ← TTS queue and speech-recognition input
/lib/storage                  ← SQLite map/cache, survey drafts, app state
/lib/wifi                     ← WiFi scanning and BLE helpers
/store                        ← Zustand building/navigation/settings/survey stores
/supabase/migrations          ← database schema and demo seed SQL
/android                      ← native Android project (uses local config)
/.github/workflows/android.yml ← CI APK build
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI
- Android device or emulator (API 26+)
- Location services enabled on device

### Installation

```bash
git clone https://github.com/Esko1m/Mini-project-disha.git
cd Mini-project-disha
npm install
npx expo run:android
```

### Database setup

Apply the files in `supabase/migrations` with the Supabase SQL Editor (run `001_initial_schema.sql`, then `002_demo_data_and_policies.sql`). Without the schema the app still runs with the built-in demo buildings and local map cache.

### Automated APK build

Every push to `main` runs `.github/workflows/android.yml`. Open the **Actions** tab, select the latest **Build Android APK** run, and download the `Disha-release-apk` artifact.

The CI APK is a release build signed with the project's debug keystore for testing. Use a production keystore or EAS for store distribution.

### Android Permissions

The following permissions are required and requested at runtime:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

> **Note:** Android 9+ limits WiFi scans to 4 per 2 minutes in the foreground. The app handles this automatically.

---

## Usage

### Step 1 — Map a Room

1. Open the app and create a new room
2. Walk to each marked position (corners, wall midpoints, center, door)
3. Stand still at each point and tap **Scan**
4. The app captures 5 WiFi samples and averages them
5. Repeat for all positions until the room is fully mapped
6. Export the fingerprint map as JSON

### Step 2 — Navigate

1. Load a mapped room
2. Stand anywhere inside and tap **Locate Me**
3. The app estimates your position and announces it
4. Enter your destination and receive step-by-step audio directions

---

## Capture Grid

For a standard rectangular room, capture at minimum:

```
NW corner ──── North wall ──── NE corner
    │                               │
 West wall        Center        East wall
    │                               │
SW corner ──── South wall ──── SE corner
                    │
                   Door
```

More capture points = better accuracy. Aim for one point per 1–1.5 m².

---

## Fingerprint Data Format

```json
{
  "roomId": "room-001",
  "roomName": "Living Room",
  "createdAt": 1725000000000,
  "samples": [
    {
      "id": "fp-001",
      "label": "corner-NE",
      "x": 4.5,
      "y": 3.0,
      "timestamp": 1725000100000,
      "accessPoints": [
        { "BSSID": "aa:bb:cc:dd:ee:ff", "SSID": "HomeWifi", "RSSI": -45, "frequency": 2437 },
        { "BSSID": "11:22:33:44:55:66", "SSID": "Neighbor",  "RSSI": -67, "frequency": 5180 }
      ]
    }
  ]
}
```

---

## Development Roadmap

- [x] Architecture design
- [ ] **Phase 1** — Android WiFi capture app
- [ ] **Phase 2** — k-NN position matching engine
- [ ] **Phase 3** — Real-time navigation + TTS directions
- [ ] **Phase 4** — iOS port with BLE beacons
- [ ] **Phase 5** — Obstacle detection (camera / ultrasonic)

---

## Engineering Notes

- **Always key by BSSID, not SSID** — multiple APs can share the same SSID (mesh networks, repeaters). BSSID is the unique hardware MAC address of each radio.
- **RSSI has noise of ±5–10 dBm** — always average multiple scans. The app takes 5 samples at 500ms intervals per capture point.
- **5GHz signals attenuate faster** through walls — this increases spatial variation and improves fingerprint discrimination. Do not filter them out.
- **Android 9+ scan throttling** — the app spaces out scans to stay within the 4-scans-per-2-minutes limit.

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Built with [Expo](https://expo.dev)
- WiFi scanning via [react-native-wifi-reborn](https://github.com/JuanSeBestia/react-native-wifi-reborn)
- Designed for accessibility — built to help visually impaired people navigate independently

---

*Made with ❤️ — because everyone deserves to navigate freely.*
