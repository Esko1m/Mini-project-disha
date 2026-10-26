import Fuse from 'fuse.js';
import type { PointOfInterest } from '../../types';

export function matchPoi(query: string, pois: PointOfInterest[]): PointOfInterest | null {
  if (!query) return null;
  const items = pois.map((p) => ({
    ...p,
    search: [p.name, ...(p.aliases || [])].join(' '),
  }));
  const fuse = new Fuse(items, {
    keys: ['search'],
    threshold: 0.4,
    includeScore: true,
  });
  const results = fuse.search(query.toLowerCase());
  if (results.length === 0) return null;
  return results[0].item as PointOfInterest;
}

export function findNearby(x: number, y: number, floor: number, pois: PointOfInterest[], radius = 20): PointOfInterest[] {
  return pois
    .filter((p) => p.floor === floor)
    .filter((p) => Math.hypot(p.x - x, p.y - y) <= radius)
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
}
