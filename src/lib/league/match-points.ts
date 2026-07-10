import type { Match, MatchResult, StandingRow, User } from "@/types/database";

function getBasePointsDelta(
  resultado: MatchResult,
  playerId: string,
  jugadorA: string,
  jugadorB: string
): number {
  if (resultado === "empate") return 1;
  if (resultado === "victoria_jugador_a" && playerId === jugadorA) return 2;
  if (resultado === "victoria_jugador_b" && playerId === jugadorB) return 2;
  return 0;
}

/** +1 PL por cada 4 PLs completos de ventaja del rival, solo si ganas estando por detrás. */
export function getUnderdogBonusPl(
  winnerPointsBefore: number,
  loserPointsBefore: number
): number {
  if (winnerPointsBefore >= loserPointsBefore) return 0;
  return Math.floor((loserPointsBefore - winnerPointsBefore) / 4);
}

export function getMatchPointsDeltaForPlayer(
  resultado: MatchResult,
  playerId: string,
  jugadorA: string,
  jugadorB: string,
  pointsBeforeA: number,
  pointsBeforeB: number
): number {
  const base = getBasePointsDelta(resultado, playerId, jugadorA, jugadorB);
  if (base < 2) return base;

  const winnerPoints =
    playerId === jugadorA ? pointsBeforeA : pointsBeforeB;
  const loserPoints =
    playerId === jugadorA ? pointsBeforeB : pointsBeforeA;

  return base + getUnderdogBonusPl(winnerPoints, loserPoints);
}

export type PlayerMatchPoints = {
  delta: number;
  total: number;
};

export type MatchPointsInfo = {
  jugador_a: PlayerMatchPoints;
  jugador_b: PlayerMatchPoints;
};

function sortMatchesChronologically<T extends Pick<Match, "id" | "fecha">>(
  matches: T[]
): T[] {
  return [...matches].sort((a, b) => {
    const byDate = a.fecha.localeCompare(b.fecha);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });
}

export function buildMatchPointsIndex(
  matches: Pick<Match, "id" | "fecha" | "jugador_a" | "jugador_b" | "resultado">[]
): Map<string, MatchPointsInfo> {
  const sorted = sortMatchesChronologically(matches);
  const totals = new Map<string, number>();
  const index = new Map<string, MatchPointsInfo>();

  for (const match of sorted) {
    const pointsBeforeA = totals.get(match.jugador_a) ?? 0;
    const pointsBeforeB = totals.get(match.jugador_b) ?? 0;

    const deltaA = getMatchPointsDeltaForPlayer(
      match.resultado,
      match.jugador_a,
      match.jugador_a,
      match.jugador_b,
      pointsBeforeA,
      pointsBeforeB
    );
    const deltaB = getMatchPointsDeltaForPlayer(
      match.resultado,
      match.jugador_b,
      match.jugador_a,
      match.jugador_b,
      pointsBeforeA,
      pointsBeforeB
    );

    const totalA = pointsBeforeA + deltaA;
    const totalB = pointsBeforeB + deltaB;

    totals.set(match.jugador_a, totalA);
    totals.set(match.jugador_b, totalB);

    index.set(match.id, {
      jugador_a: { delta: deltaA, total: totalA },
      jugador_b: { delta: deltaB, total: totalB },
    });
  }

  return index;
}

export function computeStandingsFromMatches(
  users: User[],
  matches: Match[],
  seasonId: string
): StandingRow[] {
  const seasonMatches = matches.filter((m) => m.season_id === seasonId);
  const sorted = sortMatchesChronologically(seasonMatches);
  const totals = new Map<string, number>();

  const rows = users.map((user) => {
    const played = seasonMatches.filter(
      (m) => m.jugador_a === user.id || m.jugador_b === user.id
    );

    const victorias = played.filter(
      (m) =>
        (m.jugador_a === user.id && m.resultado === "victoria_jugador_a") ||
        (m.jugador_b === user.id && m.resultado === "victoria_jugador_b")
    ).length;

    const empates = played.filter((m) => m.resultado === "empate").length;

    const derrotas = played.filter(
      (m) =>
        (m.jugador_a === user.id && m.resultado === "victoria_jugador_b") ||
        (m.jugador_b === user.id && m.resultado === "victoria_jugador_a")
    ).length;

    return {
      jugador_id: user.id,
      nombre: user.nombre,
      avatar_url: user.avatar_url,
      faccion: user.faccion,
      partidas: played.length,
      victorias,
      empates,
      derrotas,
      puntos: 0,
    };
  });

  for (const match of sorted) {
    const pointsBeforeA = totals.get(match.jugador_a) ?? 0;
    const pointsBeforeB = totals.get(match.jugador_b) ?? 0;

    const deltaA = getMatchPointsDeltaForPlayer(
      match.resultado,
      match.jugador_a,
      match.jugador_a,
      match.jugador_b,
      pointsBeforeA,
      pointsBeforeB
    );
    const deltaB = getMatchPointsDeltaForPlayer(
      match.resultado,
      match.jugador_b,
      match.jugador_a,
      match.jugador_b,
      pointsBeforeA,
      pointsBeforeB
    );

    totals.set(match.jugador_a, pointsBeforeA + deltaA);
    totals.set(match.jugador_b, pointsBeforeB + deltaB);
  }

  for (const row of rows) {
    row.puntos = totals.get(row.jugador_id) ?? 0;
  }

  return rows.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.victorias - a.victorias ||
      a.partidas - b.partidas ||
      a.nombre.localeCompare(b.nombre)
  );
}

export function pointsDeltaColorClass(delta: number): string {
  if (delta >= 2) return "text-emerald-600";
  if (delta === 1) return "text-[var(--foreground)]";
  return "text-red-500";
}
