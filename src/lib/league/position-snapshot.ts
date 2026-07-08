import { isMockMode, isStaticDemo } from "@/lib/config";
import type { StandingRow } from "@/types/database";
import { addPositions } from "./standings";

export type PositionSnapshot = Record<string, number>;

const SNAPSHOT_PREFIX = "liga-standings-snapshot-";

const globalForSnapshot = globalThis as typeof globalThis & {
  __ligaPositionSnapshot?: Record<string, PositionSnapshot>;
};

function snapshotKey(seasonId: string): string {
  return `${SNAPSHOT_PREFIX}${seasonId}`;
}

export function capturePositionSnapshot(
  standings: StandingRow[]
): PositionSnapshot {
  const positioned = addPositions(standings);
  return Object.fromEntries(
    positioned.map((row) => [row.jugador_id, row.posicion!])
  );
}

export function savePositionSnapshot(
  seasonId: string,
  snapshot: PositionSnapshot
): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(snapshotKey(seasonId), JSON.stringify(snapshot));
    return;
  }
  if (!globalForSnapshot.__ligaPositionSnapshot) {
    globalForSnapshot.__ligaPositionSnapshot = {};
  }
  globalForSnapshot.__ligaPositionSnapshot[seasonId] = snapshot;
}

export function loadPositionSnapshot(
  seasonId: string
): PositionSnapshot | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(snapshotKey(seasonId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PositionSnapshot;
    } catch {
      return null;
    }
  }
  return globalForSnapshot.__ligaPositionSnapshot?.[seasonId] ?? null;
}

export function captureStandingsSnapshot(
  seasonId: string,
  standings: StandingRow[]
): void {
  savePositionSnapshot(seasonId, capturePositionSnapshot(standings));
}

export function attachPreviousPositions(
  standings: StandingRow[],
  previous: PositionSnapshot
): StandingRow[] {
  return standings.map((row) => ({
    ...row,
    posicion_anterior: previous[row.jugador_id] ?? row.posicion,
  }));
}

/** Desplazamientos demo: positivo = estaba más abajo (sube), negativo = estaba más arriba (baja). */
const DEMO_POSITION_SHIFTS = [1, -1, 0, -2, 2];

export function attachDemoPositionChanges(
  standings: StandingRow[]
): StandingRow[] {
  const total = standings.length;
  return standings.map((row, index) => {
    const shift = DEMO_POSITION_SHIFTS[index % DEMO_POSITION_SHIFTS.length];
    if (shift === 0 || row.posicion == null) return row;
    const previous = row.posicion + shift;
    if (previous < 1 || previous > total) return row;
    return { ...row, posicion_anterior: previous };
  });
}

export function enrichStandingsWithPositionChanges(
  standings: StandingRow[],
  seasonId: string,
  options?: { demoSeed?: boolean }
): StandingRow[] {
  const positioned = addPositions(standings);
  const snapshot = loadPositionSnapshot(seasonId);
  if (snapshot) {
    return attachPreviousPositions(positioned, snapshot);
  }
  if (options?.demoSeed ?? (isMockMode() || isStaticDemo())) {
    return attachDemoPositionChanges(positioned);
  }
  return positioned;
}

export function getPositionChange(
  posicion?: number,
  posicionAnterior?: number
): "up" | "down" | null {
  if (
    posicion == null ||
    posicionAnterior == null ||
    posicionAnterior === posicion
  ) {
    return null;
  }
  return posicion < posicionAnterior ? "up" : "down";
}
