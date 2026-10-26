import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';
import type { NavigationEdge, NavigationNode } from '../types';

interface FloorMapProps {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  path: string[];
  floor: number;
  position: { x: number; y: number; floor: number } | null;
  destination: { x: number; y: number; floor: number; name: string } | null;
}

export default function FloorMap({
  nodes,
  edges,
  path,
  floor,
  position,
  destination,
}: FloorMapProps) {
  const floorNodes = nodes.filter((n) => n.floor === floor);

  if (floorNodes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No floor plan is available for this floor.</Text>
      </View>
    );
  }

  const nodeById = new Map(floorNodes.map((n) => [n.id, n]));
  const floorEdges = edges.filter(
    (e) => nodeById.has(e.from_node) && nodeById.has(e.to_node)
  );

  const bounds: { x: number; y: number }[] = [...floorNodes];
  if (position && position.floor === floor) bounds.push(position);
  if (destination && destination.floor === floor) bounds.push(destination);

  const xs = bounds.map((n) => n.x);
  const ys = bounds.map((n) => n.y);
  const rawMinX = Math.min(...xs);
  const rawMaxX = Math.max(...xs);
  const rawMinY = Math.min(...ys);
  const rawMaxY = Math.max(...ys);
  const contentWidth = Math.max(rawMaxX - rawMinX, 10);
  const contentHeight = Math.max(rawMaxY - rawMinY, 10);
  const span = Math.max(contentWidth, contentHeight);
  const padding = span * 0.12;
  const width = contentWidth + padding * 2;
  const height = contentHeight + padding * 2;
  const minX =
    rawMinX - padding - (contentWidth - (rawMaxX - rawMinX)) / 2;
  const minY =
    rawMinY - padding - (contentHeight - (rawMaxY - rawMinY)) / 2;
  const stroke = Math.max(0.25, span * 0.012);
  const nodeRadius = Math.max(0.35, span * 0.018);
  const markerRadius = Math.max(0.7, span * 0.035);
  const fontSize = Math.max(1.6, Math.min(span * 0.045, 4));

  const segments: NavigationNode[][] = [];
  let segment: NavigationNode[] = [];
  for (const id of path) {
    const node = nodeById.get(id);
    if (node) {
      segment.push(node);
    } else if (segment.length > 0) {
      segments.push(segment);
      segment = [];
    }
  }
  if (segment.length > 0) segments.push(segment);

  const labeledTypes = new Set([
    'entrance',
    'elevator',
    'stairs',
    'escalator',
    'poi',
    'exit',
  ]);

  return (
    <View style={styles.container} accessible accessibilityLabel="Floor plan with route and current position">
      <Svg
        width="100%"
        height="100%"
        viewBox={`${minX} ${minY} ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <G>
          {floorEdges.map((edge) => {
            const from = nodeById.get(edge.from_node)!;
            const to = nodeById.get(edge.to_node)!;
            return (
              <Line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#3d3d3d"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
            );
          })}
        </G>

        {segments.map((nodesOnFloor, index) =>
          nodesOnFloor.length > 1 ? (
            <Polyline
              key={`path-${index}`}
              points={nodesOnFloor.map((n) => `${n.x},${n.y}`).join(' ')}
              fill="none"
              stroke="#1a73e8"
              strokeWidth={stroke * 2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null
        )}

        {floorNodes.map((node) => (
          <Circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={node.type === 'poi' ? '#8ab4f8' : '#8a8a8a'}
          />
        ))}

        {floorNodes
          .filter((n) => labeledTypes.has(n.type))
          .map((node) => (
            <SvgText
              key={`label-${node.id}`}
              x={node.x}
              y={node.y - nodeRadius - fontSize * 0.35}
              fill="#d8d8d8"
              fontSize={fontSize}
              textAnchor="middle"
            >
              {node.label}
            </SvgText>
          ))}

        {destination && destination.floor === floor ? (
          <G>
            <Circle
              cx={destination.x}
              cy={destination.y}
              r={markerRadius}
              fill="#2e7d32"
              stroke="#ffffff"
              strokeWidth={stroke}
            />
            <SvgText
              x={destination.x}
              y={destination.y - markerRadius - fontSize * 0.5}
              fill="#9be29f"
              fontSize={fontSize * 1.05}
              fontWeight="700"
              textAnchor="middle"
            >
              {destination.name}
            </SvgText>
          </G>
        ) : null}

        {position && position.floor === floor ? (
          <G>
            <Circle
              cx={position.x}
              cy={position.y}
              r={markerRadius * 1.1}
              fill="#d93025"
              stroke="#ffffff"
              strokeWidth={stroke}
            />
            <Circle
              cx={position.x}
              cy={position.y}
              r={markerRadius * 0.38}
              fill="#ffffff"
            />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
