import type {
  Availability,
  Match,
  RecommendedMatch,
  StandingRow,
  TimeSlot,
  User,
} from "@/types/database";
import { getWeekDates as getWeekDatesFromWeek } from "@/lib/league/week";
import { computeHandicap } from "./standings";

export const MATCH_WEIGHTS = {
  neverPlayed: 1000,
  fewerMatches: 100,
  availabilityOverlap: 10,
  consecutiveRepeat: -500,
  previousRepeat: -50,
};

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

  if (sorted.length === 0) return null;
  const last = sorted[0];
  return last.jugador_a === playerId ? last.jugador_b : last.jugador_a;
}

function getAvailabilitySlots(
  playerId: string,
  availability: Availability[]
): Set<string> {
  return new Set(
    availability
      .filter((a) => a.jugador_id === playerId && a.disponible)
      .map((a) => `${a.fecha}|${a.franja}`)
  );
}

function getOverlap(
  playerId: string,
  opponentId: string,
  availability: Availability[]
): { fecha: string; franja: TimeSlot }[] {
  const playerSlots = getAvailabilitySlots(playerId, availability);
  return availability
    .filter(
      (a) =>
        a.jugador_id === opponentId &&
        a.disponible &&
        playerSlots.has(`${a.fecha}|${a.franja}`)
    )
    .map((a) => ({ fecha: a.fecha, franja: a.franja }));
}

function scorePairing(
  playerId: string,
  opponent: User,
  matches: Match[],
  availability: Availability[],
  maxMatches: number
): { score: number; overlappingSlots: { fecha: string; franja: TimeSlot }[] } {
  let score = 0;
  const opponentId = opponent.id;

  if (!havePlayed(playerId, opponentId, matches)) {
    score += MATCH_WEIGHTS.neverPlayed;
  }

  const opponentMatches = countMatches(opponentId, matches);
  score += (maxMatches - opponentMatches) * MATCH_WEIGHTS.fewerMatches;

  const overlap = getOverlap(playerId, opponentId, availability);
  score += overlap.length * MATCH_WEIGHTS.availabilityOverlap;

  const lastOpponent = getLastOpponent(playerId, matches);
  if (lastOpponent === opponentId) {
    score += MATCH_WEIGHTS.consecutiveRepeat;
  }

  const previousCount = countPreviousMatchups(playerId, opponentId, matches);
  score += previousCount * MATCH_WEIGHTS.previousRepeat;

  return { score, overlappingSlots: overlap };
}

export function getRecommendedMatch(
  player: User,
  opponents: User[],
  matches: Match[],
  availability: Availability[],
  standings: StandingRow[]
): RecommendedMatch | null {
  const candidates = opponents.filter((o) => o.id !== player.id);
  if (candidates.length === 0) return null;

  const maxMatches = Math.max(
    countMatches(player.id, matches),
    ...candidates.map((o) => countMatches(o.id, matches)),
    0
  );

  const playerSlots = getAvailabilitySlots(player.id, availability);
  const withAvailability = candidates.filter((o) => {
    const overlap = getOverlap(player.id, o.id, availability);
    return overlap.length > 0 || playerSlots.size === 0;
  });

  const pool = withAvailability.length > 0 ? withAvailability : candidates;

  let best: RecommendedMatch | null = null;

  for (const opponent of pool) {
    const { score, overlappingSlots } = scorePairing(
      player.id,
      opponent,
      matches,
      availability,
      maxMatches
    );

    const standingA = standings.find((s) => s.jugador_id === player.id);
    const standingB = standings.find((s) => s.jugador_id === opponent.id);
    const handicap = computeHandicap(
      standingA?.puntos ?? 0,
      standingB?.puntos ?? 0,
      player.id,
      opponent.id
    );

    const candidate: RecommendedMatch = {
      opponent,
      score,
      overlappingSlots,
      handicap,
    };

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

export function getWeekDates(reference = new Date(), weekOffset = 0): string[] {
  return getWeekDatesFromWeek(reference, weekOffset);
}
