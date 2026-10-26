import { create } from 'zustand';
import type { Building, Floor, NavigationEdge, NavigationNode, PointOfInterest } from '../types';

interface BuildingState {
  buildings: Building[];
  selectedBuilding: Building | null;
  floors: Floor[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: PointOfInterest[];
  setBuildings: (b: Building[]) => void;
  selectBuilding: (b: Building | null) => void;
  loadMap: (map: { floors: Floor[]; nodes: NavigationNode[]; edges: NavigationEdge[]; pois: PointOfInterest[] }) => void;
  clear: () => void;
}

export const useBuildingStore = create<BuildingState>((set) => ({
  buildings: [],
  selectedBuilding: null,
  floors: [],
  nodes: [],
  edges: [],
  pois: [],
  setBuildings: (b) => set({ buildings: b }),
  selectBuilding: (b) =>
    set({ selectedBuilding: b, floors: [], nodes: [], edges: [], pois: [] }),
  loadMap: (map) => set({ floors: map.floors, nodes: map.nodes, edges: map.edges, pois: map.pois }),
  clear: () => set({ floors: [], nodes: [], edges: [], pois: [] }),
}));
