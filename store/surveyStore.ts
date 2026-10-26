import { create } from 'zustand';
import type { APReading } from '../types';

interface SurveyPoint {
  x: number;
  y: number;
  floor: number;
  label?: string;
  readings: APReading[];
}

interface SurveyState {
  buildingId: string | null;
  floor: number;
  isActive: boolean;
  points: SurveyPoint[];
  lastScan: APReading[];
  setBuilding: (id: string | null) => void;
  setFloor: (f: number) => void;
  startSurvey: () => void;
  endSurvey: () => void;
  setLastScan: (scan: APReading[]) => void;
  addPoint: (p: SurveyPoint) => void;
  removePoint: (x: number, y: number, floor: number) => void;
  removeLastPoint: () => void;
  clearPointsForFloor: (floor: number) => void;
  clear: () => void;
}

export const useSurveyStore = create<SurveyState>((set) => ({
  buildingId: null,
  floor: 1,
  isActive: false,
  points: [],
  lastScan: [],
  setBuilding: (id) => set({ buildingId: id }),
  setFloor: (f) => set({ floor: f }),
  startSurvey: () => set({ isActive: true, points: [] }),
  endSurvey: () => set({ isActive: false }),
  setLastScan: (scan) => set({ lastScan: scan }),
  addPoint: (p) => set((state) => ({ points: [...state.points, p] })),
  removePoint: (x, y, floor) =>
    set((state) => ({
      points: state.points.filter((p) => !(p.x === x && p.y === y && p.floor === floor)),
    })),
  removeLastPoint: () => set((state) => ({ points: state.points.slice(0, -1) })),
  clearPointsForFloor: (floor) =>
    set((state) => {
      const points = state.points.filter((p) => p.floor !== floor);
      return {
        points,
        isActive: points.length > 0 ? state.isActive : false,
      };
    }),
  clear: () => set({ isActive: false, points: [], lastScan: [] }),
}));
