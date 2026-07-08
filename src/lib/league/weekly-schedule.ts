import type {
  Availability,
  Match,
  ScheduledMatch,
  TimeSlot,
  User,
} from "@/types/database";
import { ACTIVE_TIME_SLOTS } from "@/types/database";
import { MATCH_WEIGHTS } from "./matching";
import { getWeekDates } from "./week";

function havePlayed(a: string, b: string, matches: Match[]): boolean {
  return matches.some(
    (m) =>
      (m.jugador_a === a && m.jugador_b === b) ||
      (m.jugador_a === b && m.jugador_b === a)
  );
}

function countMatches(playerId: string, matches: Match[]): number {
  return matches.filter(
    (m) => m.jugador_a === playerId || m.jugador_b === playerId
  ).length;
}

function countPreviousMatchups(a: string, b: string, matches: Match[]): number {
  return matches.filter(
    (m) =>
      (m.jugador_a === a && m.jugador_b === b) ||
      (m.jugador_a === b && m.jugador_b === a)
  ).length;
}

function getLastOpponent(playerId: string, matches: Match[]): string | null {
  const sorted = [...matches]
    .filter((m) => m.jugador_a === playerId || m.jugador_b === playerId)
    .sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  if (!sorted.length) return null;
  const last = sorted[0];
  return last.jugador_a === playerId ? last.jugador_b : last.jugador_a;
}

function scorePairing(
  playerId: string,
  opponentId: string,
  matches: Match[],
  maxMatches: number
): number {
  let score = 0;
  if (!havePlayed(playerId, opponentId, matches)) {
    score += MATCH_WEIGHTS.neverPlayed;
  }
  score +=
    (maxMatches - countMatches(opponentId, matches)) *
    MATCH_WEIGHTS.fewerMatches;
  const lastOpponent = getLastOpponent(playerId, matches);
  if (lastOpponent === opponentId) score += MATCH_WEIGHTS.consecutiveRepeat;
  score +=
    countPreviousMatchups(playerId, opponentId, matches) *
    MATCH_WEIGHTS.previousRepeat;
  return score;
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
  const overlap = aSlots.filter((f) => slotsForDay(b, fecha, availability).includes(f));
  return overlap[0] ?? null;
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

  const assignedPerDay = new Map<string, Set<string>>();
  for (const date of weekDates) {
    assignedPerDay.set(date, new Set());
  }
  for (const s of activeExisting) {
    assignedPerDay.get(s.fecha)?.add(s.jugador_a);
    assignedPerDay.get(s.fecha)?.add(s.jugador_b);
  }

  const results: ScheduledMatch[] = [...activeExisting];
  const maxMatches = Math.max(
    ...users.map((u) => countMatches(u.id, playedMatches)),
    0
  );

  for (const fecha of weekDates) {
    const assigned = assignedPerDay.get(fecha)!;
    let pool = users.filter(
      (u) =>
        !assigned.has(u.id) &&
        slotsForDay(u.id, fecha, availability).length > 0
    );

    while (pool.length >= 2) {
      let bestPair: [User, User] | null = null;
      let bestScore = -Infinity;
      let iterations = 0;
      const maxIterations = pool.length * pool.length;

      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          if (++iterations > maxIterations) break;
          const a = pool[i];
          const b = pool[j];
          const franja = pickFranja(a.id, b.id, fecha, availability);
          if (!franja) continue;

          const score =
            scorePairing(a.id, b.id, playedMatches, maxMatches) +
            MATCH_WEIGHTS.availabilityOverlap;

          if (score > bestScore) {
            bestScore = score;
            bestPair = [a, b];
          }
        }
      }

      if (!bestPair) break;

      const [playerA, playerB] = bestPair;
      const franja = pickFranja(playerA.id, playerB.id, fecha, availability)!;

      const scheduled: ScheduledMatch = {
        id: `sched-${weekStart}-${fecha}-${playerA.id}-${playerB.id}`,
        season_id: seasonId,
        jugador_a: playerA.id,
        jugador_b: playerB.id,
        fecha,
        franja,
        week_start: weekStart,
        status: "programado",
        created_at: new Date().toISOString(),
      };

      results.push(scheduled);
      assigned.add(playerA.id);
      assigned.add(playerB.id);
      pool = pool.filter(
        (u) => u.id !== playerA.id && u.id !== playerB.id
      );
    }
  }

  return results;
}

export function getPlayerScheduledForWeek(
  scheduled: ScheduledMatch[],
  playerId: string,
  weekStart: string
): ScheduledMatch[] {
  return scheduled
    .filter(
      (s) =>
        s.week_start === weekStart &&
        s.status === "programado" &&
        (s.jugador_a === playerId || s.jugador_b === playerId)
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
