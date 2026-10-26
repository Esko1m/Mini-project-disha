import { create } from 'zustand';

interface SettingsState {
  haptics: boolean;
  screenOn: boolean;
  muted: boolean;
  setHaptics: (v: boolean) => void;
  setScreenOn: (v: boolean) => void;
  setMuted: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  haptics: true,
  screenOn: true,
  muted: false,
  setHaptics: (v) => set({ haptics: v }),
  setScreenOn: (v) => set({ screenOn: v }),
  setMuted: (v) => set({ muted: v }),
}));
