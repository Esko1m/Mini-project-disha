import { create } from 'zustand';
import type { NavigationEdge, NavigationNode, PointOfInterest } from '../types';

interface NavigationState {
  buildingId: string | null;
  currentFloor: number;
  position: { x: number; y: number; floor: number } | null;
  confidence: number;
  destination: PointOfInterest | null;
  path: string[];
  currentNodeId: string | null;
  instruction: string;
  nextInstruction: string;
  distanceRemaining: number;
  isNavigating: boolean;
  lastInstruction: string;
  setBuilding: (id: string | null) => void;
  setFloor: (f: number) => void;
  setPosition: (p: { x: number; y: number; floor: number }, confidence?: number) => void;
  setDestination: (poi: PointOfInterest | null) => void;
  setPath: (path: string[], distance: number) => void;
  setCurrentNode: (id: string | null) => void;
  setInstruction: (inst: string, next?: string) => void;
  startNavigation: (poi: PointOfInterest) => void;
  stopNavigation: () => void;
  setDistanceRemaining: (d: number) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  buildingId: null,
  currentFloor: 1,
  position: null,
  confidence: 0,
  destination: null,
  path: [],
  currentNodeId: null,
  instruction: '',
  nextInstruction: '',
  distanceRemaining: 0,
  isNavigating: false,
  lastInstruction: '',
  setBuilding: (id) =>
    set({
      buildingId: id,
      position: null,
      confidence: 0,
      destination: null,
      path: [],
      currentNodeId: null,
      instruction: '',
      nextInstruction: '',
      distanceRemaining: 0,
      isNavigating: false,
      lastInstruction: '',
    }),
  setFloor: (f) => set({ currentFloor: f }),
  setPosition: (p, confidence = 0) => set({ position: p, currentFloor: p.floor, confidence }),
  setDestination: (poi) => set({ destination: poi }),
  setPath: (path, distance) => set({ path, distanceRemaining: distance }),
  setCurrentNode: (id) => set({ currentNodeId: id }),
  setInstruction: (inst, next = '') => set((state) => ({ instruction: inst, nextInstruction: next, lastInstruction: inst || state.lastInstruction })),
  startNavigation: (poi) =>
    set({
      destination: poi,
      isNavigating: true,
      instruction: '',
      nextInstruction: '',
      lastInstruction: '',
      path: [],
      currentNodeId: null,
      distanceRemaining: 0,
    }),
  stopNavigation: () =>
    set({
      destination: null,
      isNavigating: false,
      path: [],
      currentNodeId: null,
      instruction: '',
      nextInstruction: '',
      lastInstruction: '',
      distanceRemaining: 0,
    }),
  setDistanceRemaining: (d) => set({ distanceRemaining: d }),
}));
