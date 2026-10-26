import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useBuildingStore } from '../../store/buildingStore';
import { useNavigationStore } from '../../store/navigationStore';
import { getBuildingMap, getBuildings } from '../../lib/api/buildings';
import { cacheBuildingMap, getCachedBuildingMap } from '../../lib/storage/localDb';
import { tts } from '../../lib/speech/tts';

const demoBuildings = [
  { id: 'demo-mall', name: 'City Mall', address: 'MG Road', city: 'Bengaluru' },
  { id: 'demo-hospital', name: 'NIMHANS Convention Centre', address: 'Hosur Road', city: 'Bengaluru' },
];

function demoMap(buildingId: string) {
  return {
    floors: [{ building_id: buildingId, floor_number: 1, label: 'Ground Floor' }],
    nodes: [
      { id: 'n1', building_id: buildingId, floor: 1, x: 0, y: 0, label: 'Entrance', type: 'entrance' as const, accessible: true },
      { id: 'n2', building_id: buildingId, floor: 1, x: 20, y: 0, label: 'Corridor', type: 'corridor_junction' as const, accessible: true },
      { id: 'n3', building_id: buildingId, floor: 1, x: 40, y: 0, label: 'Pharmacy', type: 'poi' as const, accessible: true },
      { id: 'n4', building_id: buildingId, floor: 1, x: 30, y: 10, label: 'Food Court', type: 'poi' as const, accessible: true },
    ],
    edges: [
      { id: 'e1', building_id: buildingId, from_node: 'n1', to_node: 'n2', distance_meters: 20, type: 'walk' as const, heading_degrees: 0 },
      { id: 'e2', building_id: buildingId, from_node: 'n2', to_node: 'n3', distance_meters: 20, type: 'walk' as const, heading_degrees: 0 },
      { id: 'e3', building_id: buildingId, from_node: 'n2', to_node: 'n4', distance_meters: 14.14, type: 'walk' as const, heading_degrees: 45 },
    ],
    pois: [
      { id: 'p1', building_id: buildingId, floor: 1, x: 40, y: 0, nearest_node: 'n3', name: 'Apollo Pharmacy', category: 'medical', aliases: ['pharmacy', 'medicine', 'chemist'], accessible: true },
      { id: 'p2', building_id: buildingId, floor: 1, x: 30, y: 10, nearest_node: 'n4', name: 'Food Court', category: 'food', aliases: ['food', 'canteen', 'restaurant'], accessible: true },
    ],
  };
}

export default function BuildingsScreen() {
  const router = useRouter();
  const buildingStore = useBuildingStore();
  const nav = useNavigationStore();
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const loadBuildings = async () => {
      tts.speak('Select a building. You can also use your current location if available.', 'normal');
      if (buildingStore.buildings.length === 0) {
        buildingStore.setBuildings(demoBuildings);
        const remote = await getBuildings();
        if (active && remote.length > 0) {
          buildingStore.setBuildings(remote);
        }
      }
    };

    loadBuildings();
    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, []);

  const applyMap = (
    b: any,
    map: { floors: any[]; nodes: any[]; edges: any[]; pois: any[] },
    message: string
  ) => {
    buildingStore.selectBuilding(b);
    nav.setBuilding(b.id);
    buildingStore.loadMap(map);
    tts.speak(message, 'normal');
    router.back();
  };

  const selectBuilding = async (b: any) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const cached = await getCachedBuildingMap(b.id).catch(() => null);
      if (!mountedRef.current) return;

      if (cached && Array.isArray(cached.nodes) && cached.nodes.length > 0) {
        applyMap(
          b,
          {
            floors: Array.isArray(cached.floors) ? cached.floors : [],
            nodes: cached.nodes,
            edges: Array.isArray(cached.edges) ? cached.edges : [],
            pois: Array.isArray(cached.pois) ? cached.pois : [],
          },
          `Loaded cached map for ${b.name}.`
        );
        return;
      }

      // Demo buildings always have a local map so the app can be explored offline.
      if (b.id.startsWith('demo-')) {
        applyMap(b, demoMap(b.id), `Using demo map for ${b.name}.`);
        return;
      }

      const map = await getBuildingMap(b.id);
      if (!mountedRef.current) return;

      if (map && map.nodes.length > 0) {
        try {
          await cacheBuildingMap(b.id, map);
        } catch {}
        if (!mountedRef.current) return;
        applyMap(
          b,
          map,
          map.pois.length > 0
            ? `Loaded ${b.name}. You can now navigate.`
            : `Loaded ${b.name}. No destinations are mapped yet.`
        );
        return;
      }

      tts.speak(
        `No map is available for ${b.name} yet. Please choose another building.`,
        'high'
      );
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.title}>Select Building</Text>
      </View>
      <FlatList
        data={buildingStore.buildings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => selectBuilding(item)} accessible accessibilityRole="button" accessibilityLabel={`Select ${item.name}`}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {[item.address, item.city].filter(Boolean).join(', ') || item.id}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
      {loading && <Text style={styles.loading}>Loading map...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 24,
  },
  header: {
    marginTop: 48,
    marginBottom: 24,
  },
  back: {
    color: '#4a9eff',
    fontSize: 18,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
  },
  loading: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 16,
  },
});
