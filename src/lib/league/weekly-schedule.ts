import type {
  Availability,
  Match,
  ScheduledMatch,
  TimeSlot,
  User,
} from "../../types/database";
import { ACTIVE_TIME_SLOTS } from "../../types/database";
import { MATCH_WEIGHTS, countMatches, havePlayed, getLastOpponent } from "./matching";
import { getWeekDates } from "./week";

interface Edge {
  playerA: User;
  playerB: User;
  fecha: string;
  franja: TimeSlot;
  weight: number;
}

function slotsForDay(
  playerId: string,
  fecha: string,
  availability: Availability[]
): TimeSlot[] {
  return ACTIVE_TIME_SLOTS.map((s) => s.key).filter((franja) =>
    availability.some(
      (a) =>
        a.jugador_id === playerId &&
        a.fecha === fecha &&
        a.franja === franja &&
        a.disponible
    )
  );
}

function pickFranja(
  a: string,
  b: string,
  fecha: string,
  availability: Availability[]
): TimeSlot | null {
  const aSlots = slotsForDay(a, fecha, availability);
  const overlap = aSlots.filter((f) =>
    slotsForDay(b, fecha, availability).includes(f)
  );
  return overlap[0] ?? null;
}

function edgeWeight(
  a: string,
  b: string,
  matches: Match[],
  maxMatches: number
): number {
  const isRepeatLast =
    getLastOpponent(a, matches) === b || getLastOpponent(b, matches) === a;
  const neverMet = !havePlayed(a, b, matches);
  const fewerMatchesBonus =
    (maxMatches - countMatches(a, matches)) * MATCH_WEIGHTS.fewerMatches +
    (maxMatches - countMatches(b, matches)) * MATCH_WEIGHTS.fewerMatches;
  return (
    MATCH_WEIGHTS.base +
    fewerMatchesBonus +
    (isRepeatLast ? MATCH_WEIGHTS.repeatLast : 0) +
    (neverMet ? MATCH_WEIGHTS.neverPlayed : 0)
  );
}

/**
 * Emparejamiento máximo ponderado mediante DP con bitmask.
 *
 * Garantía: maximiza primero el número de jugadores emparejados.
 * Entre soluciones con la misma cobertura, aplica desempatadores en orden:
 *   1. Evitar repetir el último rival (−100).
 *   2. Preferir parejas que nunca se han enfrentado (+10).
 *
 * Complejidad: O(2^n × n), n ≤ 15 → ~460 k operaciones, instant.
 */
function maximumWeightMatching(pool: User[], edges: Edge[]): Edge[] {
  const n = pool.length;
  if (n < 2) return [];

  // Para cada par (i, j) guardamos la arista de mayor peso.
  const best = new Map<string, Edge>();
  for (const edge of edges) {
    const i = pool.findIndex((p) => p.id === edge.playerA.id);
    const j = pool.findIndex((p) => p.id === edge.playerB.id);
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
    const prev = best.get(key);
    if (!prev || edge.weight > prev.weight) best.set(key, edge);
  }

  const dp = new Array<{ score: number; pairs: Edge[] } | null>(1 << n).fill(
    null
  );

  function solve(mask: number): { score: number; pairs: Edge[] } {
    if (dp[mask] !== null) return dp[mask]!;

    // Jugador de menor índice sin emparejar en este subproblema.
    let low = -1;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        low = i;
        break;
      }
    }

    if (low === -1) {
      dp[mask] = { score: 0, pairs: [] };
      return dp[mask]!;
    }

    // Opción: el jugador `low` no juega esta semana.
    let result = solve(mask & ~(1 << low));

    // Opción: emparejar `low` con otro jugador disponible.
    for (let j = low + 1; j < n; j++) {
      if (!(mask & (1 << j))) continue;
      const edge = best.get(`${low}-${j}`);
      if (!edge) continue;

      const sub = solve(mask & ~(1 << low) & ~(1 << j));
      const score = edge.weight + sub.score;
      if (score > result.score) {
        result = { score, pairs: [edge, ...sub.pairs] };
      }
    }

    dp[mask] = result;
    return result;
  }

  return solve((1 << n) - 1).pairs;
}

export function generateWeeklySchedule(
  seasonId: string,
  weekStart: string,
  users: User[],
  availability: Availability[],
  playedMatches: Match[],
  existing: ScheduledMatch[] = []
): ScheduledMatch[] {
  const weekDates = getWeekDates(new Date(weekStart + "T00:00:00"), 0);
  const activeExisting = existing.filter(
    (s) => s.week_start === weekStart && s.status === "programado"
  );

  // Jugadores ya emparejados esta semana.
  const alreadyMatched = new Set<string>(
    activeExisting.flatMap((s) => [s.jugador_a, s.jugador_b])
  );

  // Pool: jugadores sin partido asignado con al menos una franja disponible esta semana.
  const pool = users.filter(
    (u) =>
      !alreadyMatched.has(u.id) &&
      weekDates.some((fecha) => slotsForDay(u.id, fecha, availability).length > 0)
  );

  if (pool.length < 2) return [...activeExisting];

  const maxMatches = Math.max(
    0,
    ...users.map((u) => countMatches(u.id, playedMatches))
  );

  // Aristas: para cada par, primer día de la semana con hueco compatible.
  const edges: Edge[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      for (const fecha of weekDates) {
        const franja = pickFranja(a.id, b.id, fecha, availability);
        if (franja) {
          edges.push({
            playerA: a,
            playerB: b,
            fecha,
            franja,
            weight: edgeWeight(a.id, b.id, playedMatches, maxMatches),
          });
          break;
        }
      }
    }
  }

  const matched = maximumWeightMatching(pool, edges);

  const newMatches: ScheduledMatch[] = matched.map((edge) => ({
    id: `sched-${weekStart}-${edge.fecha}-${edge.playerA.id}-${edge.playerB.id}`,
    season_id: seasonId,
    jugador_a: edge.playerA.id,
    jugador_b: edge.playerB.id,
    fecha: edge.fecha,
    franja: edge.franja,
    week_start: weekStart,
    status: "programado",
    created_at: new Date().toISOString(),
  }));

  return [...activeExisting, ...newMatches];
}
