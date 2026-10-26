import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import InstructionBanner from '../../components/InstructionBanner';
import FloorMap from '../../components/FloorMap';
import { useNavigationStore } from '../../store/navigationStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { tts } from '../../lib/speech/tts';
import { scanWifiWithTimeout, scanToMap } from '../../lib/wifi/scanner';
import { locatePosition } from '../../lib/api/locate';
import {
  buildGraph,
  findPath,
  getEdgeBetween,
  pathDistance,
  snapToNearestNode,
} from '../../lib/navigation/pathfinder';
import { generateInstruction } from '../../lib/navigation/instructions';
import { DeadReckoning } from '../../lib/navigation/deadReckoning';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useVoiceInput } from '../../lib/speech/voiceInput';
import { parseIntent } from '../../lib/speech/intentParser';
import type { NavigationNode, PointOfInterest } from '../../types';

const KEEP_AWAKE_TAG = 'disha-navigation';
const LOCATION_INTERVAL_MS = 3000;
const MIN_CONFIDENCE = 0.3;
const ARRIVAL_RADIUS_METERS = 3;

function impact() {
  if (useSettingsStore.getState().haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

function arrivalFeedback() {
  if (useSettingsStore.getState().haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

function resolveDestinationNode(
  destination: PointOfInterest,
  nodes: NavigationNode[]
): NavigationNode | null {
  if (destination.nearest_node) {
    const direct = nodes.find((n) => n.id === destination.nearest_node);
    if (direct) return direct;
  }

  const snapped = snapToNearestNode(
    destination.x,
    destination.y,
    destination.floor,
    nodes
  );
  if (snapped) return snapped;

  const byName = nodes.find((n) =>
    n.label.toLowerCase().includes(destination.name.toLowerCase())
  );
  return byName ?? null;
}

export default function NavigateScreen() {
  const router = useRouter();
  const nav = useNavigationStore();
  const nodes = useBuildingStore((s) => s.nodes);
  const edges = useBuildingStore((s) => s.edges);
  const screenOn = useSettingsStore((s) => s.screenOn);
  const [pathNodes, setPathNodes] = useState<string[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const drRef = useRef<DeadReckoning | null>(null);
  const graphRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<string[]>([]);
  const currentNodeRef = useRef<string | null>(null);
  const destinationRef = useRef<PointOfInterest | null>(null);
  const destNodeRef = useRef<string | null>(null);
  const headingRef = useRef<number | null>(null);
  const lastFixRef = useRef(0);
  const locatingRef = useRef(false);
  const arrivedRef = useRef(false);
  const mountedRef = useRef(true);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arrive = useCallback(() => {
    if (arrivedRef.current) return;
    arrivedRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const state = useNavigationStore.getState();
    state.setInstruction('You have arrived at your destination.');
    state.setDistanceRemaining(0);
    tts.speak('You have arrived at your destination.', 'urgent');
    arrivalFeedback();

    arrivalTimerRef.current = setTimeout(() => {
      if (mountedRef.current) router.replace('/(navigation)/arrived');
    }, 1500);
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    arrivedRef.current = false;
    locatingRef.current = false;
    lastFixRef.current = 0;
    const destination = useNavigationStore.getState().destination;
    const selectedBuilding = useBuildingStore.getState().selectedBuilding;
    const nodes = useBuildingStore.getState().nodes;
    const edges = useBuildingStore.getState().edges;

    if (!destination || !selectedBuilding || nodes.length === 0) {
      router.replace('/(navigation)');
      return;
    }

    destinationRef.current = destination;
    graphRef.current = buildGraph(nodes, edges);

    const destinationNode = resolveDestinationNode(destination, nodes);
    if (!destinationNode) {
      nav.setInstruction('No route is available to this destination.');
      tts.speak('Sorry, I could not find this destination on the map.', 'high');
      return;
    }
    destNodeRef.current = destinationNode.id;

    const position = useNavigationStore.getState().position;
    const start = position
      ? snapToNearestNode(position.x, position.y, position.floor, nodes)
      : nodes.find((n) => n.type === 'entrance') ??
        snapToNearestNode(0, 0, destination.floor, nodes);

    if (!start) {
      nav.setInstruction('No starting point is available on this floor.');
      tts.speak('Sorry, I could not find a starting point on this floor.', 'high');
      return;
    }

    drRef.current = new DeadReckoning(start.x, start.y);
    currentNodeRef.current = start.id;
    setCurrentNodeId(start.id);
    nav.setCurrentNode(start.id);

    if (!position) {
      nav.setPosition(
        { x: start.x, y: start.y, floor: start.floor },
        0
      );
    }

    const path = findPath(graphRef.current, start.id, destinationNode.id);
    if (path.length === 0) {
      nav.setInstruction('No route is available to this destination.');
      tts.speak('Sorry, I could not find a route to this destination.', 'high');
      return;
    }

    pathRef.current = path;
    setPathNodes(path);
    nav.setPath(path, pathDistance(path, edges));

    const announce = (nodeId: string, isInitial: boolean) => {
      const route = pathRef.current;
      const index = route.indexOf(nodeId);
      if (index === -1) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      currentNodeRef.current = nodeId;
      setCurrentNodeId(nodeId);
      nav.setCurrentNode(nodeId);

      if (index >= route.length - 1) {
        nav.setDistanceRemaining(0);
        return;
      }

      const nextNode = nodes.find((n) => n.id === route[index + 1]);
      const edge = getEdgeBetween(edges, nodeId, route[index + 1]);
      const geometricHeading = nextNode
        ? ((Math.atan2(nextNode.y - node.y, nextNode.x - node.x) * 180) /
            Math.PI +
            360) %
          360
        : 0;
      const heading = isInitial
        ? geometricHeading
        : headingRef.current ?? geometricHeading;

      const instruction =
        edge && nextNode
          ? generateInstruction(node, nextNode, edge, heading)
          : `Continue towards ${nextNode?.label || 'the next waypoint'}.`;

      nav.setInstruction(instruction);
      nav.setDistanceRemaining(pathDistance(route.slice(index), edges));
      tts.speak(instruction, 'high');
      impact();
    };

    announce(start.id, true);

    if (path.length === 1) {
      if (position) {
        arrive();
      } else {
        nav.setInstruction(
          'You are at the destination. Waiting for a WiFi location update to confirm.'
        );
      }
    }

    Accelerometer.setUpdateInterval(200);
    const accSub = Accelerometer.addListener(({ x, y, z }) => {
      const dr = drRef.current;
      if (!dr) return;
      dr.onAcceleration(x, y, z);

      if (Date.now() - lastFixRef.current > 6000) {
        const state = useNavigationStore.getState();
        const deadReckoned = dr.getPosition();
        state.setPosition(
          {
            x: deadReckoned.x,
            y: deadReckoned.y,
            floor: state.position?.floor ?? start.floor,
          },
          Math.min(state.confidence, 0.2)
        );
      }
    });

    Magnetometer.setUpdateInterval(200);
    const magSub = Magnetometer.addListener(({ x, y }) => {
      const heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      headingRef.current = heading;
      drRef.current?.setHeading(heading);
    });

    intervalRef.current = setInterval(async () => {
      if (locatingRef.current || arrivedRef.current) return;

      const activeBuilding = useBuildingStore.getState().selectedBuilding;
      const dest = destinationRef.current;
      if (!activeBuilding || !dest) return;

      locatingRef.current = true;
      try {
        const scan = await scanWifiWithTimeout();
        const scanMap = scanToMap(scan);
        if (Object.keys(scanMap).length === 0) return;

        const location = await locatePosition({
          building_id: activeBuilding.id,
          scan: scanMap,
        });
        if (!location || location.confidence <= MIN_CONFIDENCE) return;

        lastFixRef.current = Date.now();
        nav.setPosition(
          { x: location.x, y: location.y, floor: location.floor },
          location.confidence
        );
        drRef.current?.correct(location.x, location.y);

        if (
          location.floor === dest.floor &&
          Math.hypot(location.x - dest.x, location.y - dest.y) <=
            ARRIVAL_RADIUS_METERS
        ) {
          arrive();
          return;
        }

        const nearest = snapToNearestNode(
          location.x,
          location.y,
          location.floor,
          nodes
        );
        if (!nearest) return;

        const destNodeId = destNodeRef.current;
        if (!destNodeId) return;

        if (nearest.id === destNodeId) {
          const destNode = nodes.find((n) => n.id === destNodeId);
          if (
            destNode &&
            Math.hypot(location.x - destNode.x, location.y - destNode.y) <=
              ARRIVAL_RADIUS_METERS
          ) {
            arrive();
            return;
          }
        }

        const path = pathRef.current;
        const nearestIndex = path.indexOf(nearest.id);

        if (nearestIndex === -1) {
          const newPath = findPath(graphRef.current, nearest.id, destNodeId);
          if (newPath.length > 0) {
            pathRef.current = newPath;
            setPathNodes(newPath);
            nav.setPath(newPath, pathDistance(newPath, edges));
            announce(nearest.id, false);
          }
          return;
        }

        const currentIndex = path.indexOf(currentNodeRef.current ?? '');

        if (nearestIndex > currentIndex) {
          announce(nearest.id, false);
          return;
        }

        const index = currentIndex >= 0 ? currentIndex : nearestIndex;
        const nextNode = nodes.find((n) => n.id === path[index + 1]);
        const rest = pathDistance(path.slice(index + 1), edges);
        const edgeToNext = nextNode
          ? getEdgeBetween(edges, path[index], nextNode.id)
          : null;
        const toNext = nextNode
          ? nextNode.floor === location.floor
            ? Math.hypot(location.x - nextNode.x, location.y - nextNode.y)
            : edgeToNext?.distance_meters ?? 0
          : 0;
        nav.setDistanceRemaining(Math.max(0, toNext + rest));
      } finally {
        locatingRef.current = false;
      }
    }, LOCATION_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      accSub.remove();
      magSub.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (arrivalTimerRef.current) {
        clearTimeout(arrivalTimerRef.current);
        arrivalTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (screenOn) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }

    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [screenOn]);

  const onVoiceResult = (text: string) => {
    const intent = parseIntent(text);
    if (intent.type === 'repeat') {
      tts.speak(nav.lastInstruction || nav.instruction, 'high');
    } else if (intent.type === 'where_am_i') {
      if (nav.position) {
        tts.speak(
          `You are at floor ${nav.position.floor}. ${nav.instruction}`,
          'normal'
        );
      }
    } else if (intent.type === 'how_far') {
      tts.speak(
        `Distance remaining approximately ${Math.round(
          nav.distanceRemaining
        )} meters.`,
        'normal'
      );
    } else if (intent.type === 'stop') {
      stopNav();
    } else if (intent.type === 'help') {
      tts.speak('Say Repeat, Where am I, How far, or Stop.', 'normal');
    }
  };

  const voice = useVoiceInput(onVoiceResult);

  const stopNav = () => {
    arrivedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (arrivalTimerRef.current) {
      clearTimeout(arrivalTimerRef.current);
      arrivalTimerRef.current = null;
    }
    tts.stop();
    tts.speak('Navigation stopped.', 'normal');
    nav.stopNavigation();
    router.replace('/(navigation)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.destName}>To: {nav.destination?.name}</Text>
        <Text style={styles.floor}>
          Floor: {nav.currentFloor}
          {pathNodes.length > 0
            ? ` • Step ${Math.max(
                1,
                pathNodes.indexOf(currentNodeId ?? '') + 1
              )}/${pathNodes.length}`
            : ''}
        </Text>
      </View>
      <View style={styles.mapContainer}>
        <FloorMap
          nodes={nodes}
          edges={edges}
          path={pathNodes}
          floor={nav.currentFloor}
          position={nav.position}
          destination={nav.destination}
        />
      </View>
      <View style={styles.mapStatus}>
        <Text style={styles.mapSubtext}>
          Position:{' '}
          {nav.position
            ? `(${nav.position.x.toFixed(1)}, ${nav.position.y.toFixed(1)})`
            : 'Locating...'}
        </Text>
        <Text style={styles.mapSubtext}>
          Confidence: {(nav.confidence * 100).toFixed(0)}%
        </Text>
      </View>
      <InstructionBanner
        instruction={nav.instruction}
        distanceRemaining={nav.distanceRemaining}
        floor={nav.currentFloor}
      />
      <View style={styles.controls}>
        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            tts.speak(nav.lastInstruction || nav.instruction, 'high');
          }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Repeat instruction"
        >
          <Text style={styles.controlText}>🔁 Repeat</Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, voice.isListening && styles.controlBtnActive]}
          onPress={() =>
            voice.isListening ? voice.stop() : voice.start('en-IN')
          }
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voice command"
        >
          <Text style={styles.controlText}>
            {voice.isListening ? '🎙️ Listening' : '🎙️ Speak'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, styles.stopBtn]}
          onPress={stopNav}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Stop navigation"
        >
          <Text style={styles.controlText}>⏹️ Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    marginTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  destName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  floor: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  mapStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  mapSubtext: {
    color: '#aaa',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#d93025',
  },
  stopBtn: {
    backgroundColor: '#d93025',
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
