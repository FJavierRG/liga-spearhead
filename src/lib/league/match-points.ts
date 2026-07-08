import type { Match, MatchResult } from "@/types/database";

export function getMatchPointsDelta(
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

export type PlayerMatchPoints = {
  delta: number;
  total: number;
};

export type MatchPointsInfo = {
  jugador_a: PlayerMatchPoints;
  jugador_b: PlayerMatchPoints;
};

export function buildMatchPointsIndex(
  matches: Pick<Match, "id" | "fecha" | "jugador_a" | "jugador_b" | "resultado">[]
): Map<string, MatchPointsInfo> {
  const sorted = [...matches].sort((a, b) => {
    const byDate = a.fecha.localeCompare(b.fecha);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });

  const totals = new Map<string, number>();
  const index = new Map<string, MatchPointsInfo>();

  for (const match of sorted) {
    const deltaA = getMatchPointsDelta(
      match.resultado,
      match.jugador_a,
      match.jugador_a,
      match.jugador_b
    );
    const deltaB = getMatchPointsDelta(
      match.resultado,
      match.jugador_b,
      match.jugador_a,
      match.jugador_b
    );

    const totalA = (totals.get(match.jugador_a) ?? 0) + deltaA;
    const totalB = (totals.get(match.jugador_b) ?? 0) + deltaB;

    totals.set(match.jugador_a, totalA);
    totals.set(match.jugador_b, totalB);

    index.set(match.id, {
      jugador_a: { delta: deltaA, total: totalA },
      jugador_b: { delta: deltaB, total: totalB },
    });
  }

  return index;
}

export function pointsDeltaColorClass(delta: number): string {
  if (delta === 2) return "text-emerald-600";
  if (delta === 1) return "text-[var(--foreground)]";
  return "text-red-500";
}
