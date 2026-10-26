import type { NavigationEdge, NavigationNode } from '../../types';

type Direction = 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn';

function bearingToDirection(currentHeading: number, nextHeading: number): Direction {
  // Headings use the math convention (0 = east, 90 = north). A positive
  // difference therefore means the next edge is clockwise, i.e. to the right.
  let diff = ((currentHeading - nextHeading) + 360) % 360;
  if (diff > 180) diff -= 360;
  if (Math.abs(diff) < 15) return 'straight';
  if (Math.abs(diff) >= 120) return 'u-turn';
  if (diff >= 60) return 'right';
  if (diff > 15) return 'slight-right';
  if (diff <= -60) return 'left';
  if (diff < -15) return 'slight-left';
  return 'straight';
}

function nodeBearing(from: NavigationNode, to: NavigationNode): number {
  const degrees =
    (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

const directionPhrases: Record<Direction, (d: number) => string> = {
  straight: (d) => `Walk straight ahead for ${d} meters.`,
  left: (d) => `Turn left and walk ${d} meters.`,
  right: (d) => `Turn right and walk ${d} meters.`,
  'slight-left': (d) => `Bear left slightly and walk ${d} meters.`,
  'slight-right': (d) => `Bear right slightly and walk ${d} meters.`,
  'u-turn': (d) => `Turn around and walk ${d} meters.`,
};

export function generateInstruction(
  currentNode: NavigationNode,
  nextNode: NavigationNode,
  edge: NavigationEdge,
  currentHeading: number
): string {
  if (edge.type === 'elevator') {
    return `Take the elevator to floor ${nextNode.floor}.`;
  }
  if (edge.type === 'stairs') {
    const dir = nextNode.floor > currentNode.floor ? 'up' : 'down';
    return `Take the stairs ${dir} to floor ${nextNode.floor}.`;
  }
  if (edge.type === 'escalator') {
    const dir = nextNode.floor > currentNode.floor ? 'up' : 'down';
    return `Take the escalator ${dir} to floor ${nextNode.floor}.`;
  }

  const heading =
    nextNode.floor === currentNode.floor
      ? nodeBearing(currentNode, nextNode)
      : edge.heading_degrees ?? 0;
  const direction = bearingToDirection(currentHeading, heading);
  const distance = Math.max(1, Math.round(edge.distance_meters));
  return directionPhrases[direction](distance);
}
