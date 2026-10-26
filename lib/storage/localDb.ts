import * as SQLite from 'expo-sqlite';
import type { FingerprintReading, NavigationEdge, NavigationNode, PointOfInterest } from '../../types';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export async function getDb() {
  if (db) return db;

  if (!initPromise) {
    initPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('disha.db');
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS survey_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          building_id TEXT,
          floor INTEGER,
          x REAL,
          y REAL,
          label TEXT,
          readings TEXT,
          surveyed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS building_cache (
          building_id TEXT PRIMARY KEY,
          data TEXT,
          cached_at TEXT
        );
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT
        );
        CREATE TABLE IF NOT EXISTS pois_cache (
          building_id TEXT,
          pois TEXT,
          cached_at TEXT
        );
        DELETE FROM pois_cache
          WHERE rowid NOT IN (
            SELECT MAX(rowid) FROM pois_cache GROUP BY building_id
          );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_pois_cache_building
          ON pois_cache (building_id);
      `);
      db = database;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
  return db!;
}

export async function saveSurveyDraft(reading: Omit<FingerprintReading, 'id'>) {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO survey_drafts (building_id, floor, x, y, label, readings, surveyed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [reading.building_id, reading.floor, reading.x, reading.y, reading.label || '', JSON.stringify(reading.readings), reading.surveyed_at || new Date().toISOString()]
  );
  return Number(result.lastInsertRowId);
}

export async function getSurveyDrafts(buildingId?: string, floor?: number) {
  const database = await getDb();
  let sql = 'SELECT * FROM survey_drafts';
  const params: any[] = [];
  const where: string[] = [];
  if (buildingId) {
    where.push('building_id = ?');
    params.push(buildingId);
  }
  if (typeof floor === 'number') {
    where.push('floor = ?');
    params.push(floor);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY id DESC';
  const rows = await database.getAllAsync(sql, params);
  return (rows as any[]).map((r) => {
    let readings: any[] = [];
    try {
      readings = JSON.parse(r.readings);
    } catch {}
    return {
      id: r.id,
      building_id: r.building_id,
      floor: r.floor,
      x: r.x,
      y: r.y,
      label: r.label,
      readings,
      surveyed_at: r.surveyed_at,
    };
  });
}

export async function deleteSurveyDraft(id: number) {
  const database = await getDb();
  await database.runAsync('DELETE FROM survey_drafts WHERE id = ?', [id]);
}

export async function clearSurveyDrafts(buildingId?: string) {
  const database = await getDb();
  if (buildingId) {
    await database.runAsync('DELETE FROM survey_drafts WHERE building_id = ?', [buildingId]);
  } else {
    await database.runAsync('DELETE FROM survey_drafts');
  }
}

export async function cacheBuildingMap(buildingId: string, data: any) {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO building_cache (building_id, data, cached_at) VALUES (?, ?, ?)',
    [buildingId, JSON.stringify(data), new Date().toISOString()]
  );
}

export async function getCachedBuildingMap(buildingId: string): Promise<any | null> {
  const database = await getDb();
  const row = await database.getFirstAsync('SELECT data FROM building_cache WHERE building_id = ?', [buildingId]);
  if (!row) return null;
  try {
    return JSON.parse((row as any).data);
  } catch {
    return null;
  }
}

export async function cachePois(buildingId: string, pois: PointOfInterest[]) {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO pois_cache (building_id, pois, cached_at) VALUES (?, ?, ?)',
    [buildingId, JSON.stringify(pois), new Date().toISOString()]
  );
}

export async function getCachedPois(buildingId: string): Promise<PointOfInterest[]> {
  const database = await getDb();
  const row = await database.getFirstAsync('SELECT pois FROM pois_cache WHERE building_id = ?', [buildingId]);
  if (!row) return [];
  try {
    return JSON.parse((row as any).pois);
  } catch {
    return [];
  }
}

export async function getAppState(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setAppState(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)',
    [key, value]
  );
}
