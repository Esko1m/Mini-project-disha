import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import type { NavigationEdge, NavigationNode } from '../../types';

export function buildGraph(nodes: NavigationNode[], edges: NavigationEdge[]): any {
  const graph: any = new (Graph as any)({ type: 'undirected' });
  for (const node of nodes) {
    try {
      graph.addNode(node.id, { ...node });
    } catch {}
  }
  for (const edge of edges) {
    try {
      graph.addEdge(edge.from_node, edge.to_node, {
        weight: edge.distance_meters,
        ...edge,
      });
    } catch {}
  }
  return graph;
}

export function findPath(graph: any, fromNodeId: string, toNodeId: string): string[] {
  try {
    const path = (dijkstra as any).bidirectional(
      graph,
      fromNodeId,
      toNodeId,
      'weight'
    );
    return Array.isArray(path) ? path : [];
  } catch {
    return [];
  }
}

export function getEdgeBetween(
  edges: NavigationEdge[],
  fromNodeId: string,
  toNodeId: string
): NavigationEdge | null {
  return (
    edges.find(
      (e) =>
        (e.from_node === fromNodeId && e.to_node === toNodeId) ||
        (e.from_node === toNodeId && e.to_node === fromNodeId)
    ) ?? null
  );
}

export function pathDistance(path: string[], edges: NavigationEdge[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = getEdgeBetween(edges, path[i], path[i + 1]);
    if (edge) total += Math.max(0, edge.distance_meters);
  }
  return total;
}

export function snapToNearestNode(
  x: number,
  y: number,
  floor: number,
  nodes: NavigationNode[]
): NavigationNode | null {
  const candidates = nodes.filter((n) => n.floor === floor);
  if (candidates.length === 0) return null;
  let nearest = candidates[0];
  let nearestDist = Math.hypot(nearest.x - x, nearest.y - y);
  for (let i = 1; i < candidates.length; i++) {
    const node = candidates[i];
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = node;
    }
  }
  return nearest;
}
